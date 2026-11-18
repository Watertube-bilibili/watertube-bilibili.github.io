// SPDX-License-Identifier: MIT
#pragma once
#include <algorithm>
#include <cmath>
#include <cctype>
#include <cstdlib>
#include <iomanip>
#include <map>
#include <sstream>
#include <string>
#include <vector>

namespace ridgebound {
constexpr unsigned kPort = 8766;
constexpr double kMaxStrength = 0.60;
constexpr double kDefaultStrength = 0.35;
constexpr unsigned kWatchdogMs = 500;
inline double clamp(double n, double a, double b) { return std::max(a, std::min(b, n)); }
inline double normalize_axis(long value,long minimum,long maximum){if(maximum<=minimum)return 0;return clamp(2.0*(double(value)-minimum)/(double(maximum)-minimum)-1.0,-1,1);}
inline std::string lower(std::string s) { for (auto &c : s) c = char(std::tolower((unsigned char)c)); return s; }
inline std::string trim(std::string s) { const auto a=s.find_first_not_of(" \t\r\n"), b=s.find_last_not_of(" \t\r\n");return a==std::string::npos?"":s.substr(a,b-a+1); }
inline std::string json_string(const std::string &s) {
 std::ostringstream out;out << '"';for (unsigned char c:s) { switch(c) {case '"':out<<"\\\"";break;case '\\':out<<"\\\\";break;case '\n':out<<"\\n";break;case '\r':out<<"\\r";break;case '\t':out<<"\\t";break;default:if(c<32)out<<"\\u"<<std::hex<<std::setw(4)<<std::setfill('0')<<int(c)<<std::dec;else out<<c;}}out<<'"';return out.str();
}
struct JsonValue {enum Kind {Number,Boolean,String,Null} kind=Null;double number=0;bool boolean=false;std::string string;};
// Deliberately small: the API accepts one flat object only, with no duplicate keys.
inline bool parse_flat_json(const std::string &s,std::map<std::string,JsonValue> &out) {
 if(s.size()>4096)return false;
 size_t p=0;auto ws=[&]{while(p<s.size()&&std::isspace((unsigned char)s[p]))++p;};
 auto quoted=[&](std::string &v)->bool{if(p>=s.size()||s[p++]!='"')return false;while(p<s.size()){unsigned char c=s[p++];if(c=='"')return true;if(c<32)return false;if(c=='\\'){if(p>=s.size())return false;char e=s[p++];switch(e){case '"':case '\\':case '/':v+=e;break;case 'b':v+='\b';break;case 'f':v+='\f';break;case 'n':v+='\n';break;case 'r':v+='\r';break;case 't':v+='\t';break;default:return false;}}else v+=char(c);}return false;};
 ws();if(p>=s.size()||s[p++]!='{')return false;ws();if(p<s.size()&&s[p]=='}'){++p;ws();return p==s.size();}
 while(p<s.size()) {std::string key;if(!quoted(key)||key.size()>80||out.count(key))return false;ws();if(p>=s.size()||s[p++]!=':')return false;ws();JsonValue v;
  if(p<s.size()&&s[p]=='"'){v.kind=JsonValue::String;if(!quoted(v.string))return false;}
  else if(s.compare(p,4,"true")==0){v.kind=JsonValue::Boolean;v.boolean=true;p+=4;}
  else if(s.compare(p,5,"false")==0){v.kind=JsonValue::Boolean;p+=5;}
  else if(s.compare(p,4,"null")==0){p+=4;}
  else {size_t start=p;if(p<s.size()&&s[p]=='-')++p;if(p>=s.size()||!std::isdigit((unsigned char)s[p]))return false;if(s[p]=='0')++p;else while(p<s.size()&&std::isdigit((unsigned char)s[p]))++p;if(p<s.size()&&s[p]=='.'){++p;size_t a=p;while(p<s.size()&&std::isdigit((unsigned char)s[p]))++p;if(p==a)return false;}if(p<s.size()&&(s[p]=='e'||s[p]=='E')){++p;if(p<s.size()&&(s[p]=='+'||s[p]=='-'))++p;size_t a=p;while(p<s.size()&&std::isdigit((unsigned char)s[p]))++p;if(p==a)return false;}v.number=std::strtod(s.substr(start,p-start).c_str(),nullptr);if(!std::isfinite(v.number))return false;v.kind=JsonValue::Number;}
  out.emplace(key,std::move(v));ws();if(p>=s.size())return false;if(s[p]=='}'){++p;ws();return p==s.size();}if(s[p++]!=',')return false;ws();
 }return false;
}
struct Feedback {bool enabled=false;double strength=kDefaultStrength,steer=0,speed=0,slip=0,impact=0,suspension=0;std::string deviceId;};
inline bool parse_feedback(const std::string &s,Feedback &f) {
 std::map<std::string,JsonValue> v;if(!parse_flat_json(s,v))return false;
 const auto enabled=v.find("enabled");if(enabled==v.end()||enabled->second.kind!=JsonValue::Boolean)return false;f.enabled=enabled->second.boolean;
 auto num=[&](const char *name,double &target,double a,double b){auto i=v.find(name);if(i==v.end())return true;if(i->second.kind!=JsonValue::Number)return false;target=clamp(i->second.number,a,b);return true;};
 if(!num("strength",f.strength,0,kMaxStrength)||!num("steer",f.steer,-1,1)||!num("speed",f.speed,-120,120)||!num("slip",f.slip,0,1)||!num("impact",f.impact,0,1)||!num("suspension",f.suspension,0,1))return false;
 auto id=v.find("deviceId");if(id!=v.end()){if(id->second.kind!=JsonValue::String||id->second.string.size()>100)return false;f.deviceId=id->second.string;}return true;
}
struct ForceOutput {long spring=0,damper=0,constant=0;};
inline ForceOutput compute_forces(const Feedback &f,double timeSeconds) {
 ForceOutput o;if(!f.enabled||f.strength<=0)return o;double speed=std::abs(f.speed),scale=10000*f.strength;
 // DirectInput SPRING supplies the actual hardware-position restoring force.
 o.spring=long(scale*(.12+.38*clamp(speed/12,0,1))*(1-.45*f.slip));
 o.damper=long(scale*(.08+.07*clamp(speed/15,0,1)));
 double texture=std::sin(timeSeconds*(28+speed*3))*(.035+.12*f.slip+.16*f.suspension)*clamp(speed/.8,0,1);
 double impact=std::sin(timeSeconds*87)*f.impact*.35;
 o.constant=long(scale*clamp(texture+impact,-.30,.30));return o;
}
inline bool allowed_host(const std::string &host){return lower(trim(host))=="127.0.0.1:8766";}
inline bool allowed_origin(const std::string &origin){return origin=="http://127.0.0.1:8766";}
inline bool safe_relative_path(std::string uri,std::string &relative) {
 auto q=uri.find('?');if(q!=std::string::npos)uri.resize(q);if(uri.empty()||uri[0]!='/'||uri.size()>2048)return false;std::string decoded;
 auto hex=[](char c)->int{if(c>='0'&&c<='9')return c-'0';if(c>='a'&&c<='f')return c-'a'+10;if(c>='A'&&c<='F')return c-'A'+10;return -1;};
 for(size_t i=0;i<uri.size();i++){char c=uri[i];if(c=='%'){if(i+2>=uri.size())return false;int a=hex(uri[++i]),b=hex(uri[++i]);if(a<0||b<0)return false;c=char(a*16+b);}if(c=='\\'||c==':'||c==0||(unsigned char)c<32)return false;decoded+=c;}
 relative.clear();std::istringstream parts(decoded);std::string part;while(std::getline(parts,part,'/')){if(part.empty())continue;if(part=="."||part==".."||part.back()=='.'||part.back()==' ')return false;std::string n=lower(part.substr(0,part.find('.')));if(n=="con"||n=="prn"||n=="aux"||n=="nul"||(n.size()==4&&(n.substr(0,3)=="com"||n.substr(0,3)=="lpt")&&std::isdigit((unsigned char)n[3])))return false;if(!relative.empty())relative+='/';relative+=part;}
 if(relative.empty()||decoded.back()=='/')relative+=(relative.empty()?"":"/")+std::string("index.html");
 return true;
}
inline std::string mime_type(const std::string &path) {
 auto p=path.find_last_of('.');std::string ext=p==std::string::npos?"":lower(path.substr(p));if(ext==".html")return "text/html; charset=utf-8";if(ext==".js"||ext==".mjs")return "text/javascript; charset=utf-8";if(ext==".css")return "text/css; charset=utf-8";if(ext==".json"||ext==".webmanifest")return "application/json";if(ext==".wasm")return "application/wasm";if(ext==".svg")return "image/svg+xml";if(ext==".png")return "image/png";if(ext==".jpg"||ext==".jpeg")return "image/jpeg";if(ext==".ico")return "image/x-icon";if(ext==".glb")return "model/gltf-binary";if(ext==".ogg")return "audio/ogg";return "application/octet-stream";
}
}
