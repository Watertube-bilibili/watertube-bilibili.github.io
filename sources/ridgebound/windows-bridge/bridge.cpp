// SPDX-License-Identifier: MIT
// Ridgebound Windows DirectInput bridge. Build instructions: README.md.
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#define DIRECTINPUT_VERSION 0x0800
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <dinput.h>
#include <shellapi.h>
#include <objbase.h>
#include <atomic>
#include <array>
#include <chrono>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <memory>
#include <mutex>
#include <thread>
#include <vector>
#include "core.hpp"

using namespace ridgebound;
namespace fs=std::filesystem;
using Clock=std::chrono::steady_clock;
namespace {
std::atomic<bool> running{true};std::atomic<int> activeClients{0};std::mutex stateMutex;
Feedback feedback;Clock::time_point feedbackAt=Clock::time_point::min();bool emergencyLatched=false;
std::string snapshot=R"({"bridge":"ridgebound-directinput","version":1,"devices":[],"ffb":{"available":false,"armed":false,"strength":0.35,"status":"Starting"}})";
HWND windowHandle=nullptr;IDirectInput8W *directInput=nullptr;SOCKET listener=INVALID_SOCKET;
std::string origin="http://127.0.0.1:8766";fs::path webRoot;
std::string utf8(const wchar_t *s){int n=WideCharToMultiByte(CP_UTF8,0,s,-1,nullptr,0,nullptr,nullptr);if(n<=1)return "";std::string out(n,'\0');WideCharToMultiByte(CP_UTF8,0,s,-1,out.data(),n,nullptr,nullptr);out.pop_back();return out;}
std::string guid_string(const GUID &g){wchar_t text[64]{};StringFromGUID2(g,text,64);return "di:"+utf8(text);}
std::string hr_text(HRESULT hr){std::ostringstream s;s<<"DirectInput error 0x"<<std::hex<<unsigned(hr);return s.str();}
DIPROPDWORD property(DWORD value){DIPROPDWORD p{};p.diph.dwSize=sizeof(p);p.diph.dwHeaderSize=sizeof(p.diph);p.diph.dwHow=DIPH_DEVICE;p.dwData=value;return p;}
struct Device {
 GUID guid{};std::string id,name;IDirectInputDevice8W *handle=nullptr;
 bool connected=false,capable=false,armed=false,exclusive=false,hasActuator=false;
 DWORD forceAxis=DIJOFS_X,oldAutoCenter=1,oldGain=10000;
 bool savedAutoCenter=false,savedGain=false;std::string status="Input only";
 std::array<double,8> axes{};std::array<int,128> buttons{};std::array<bool,8> axisAvailable{};std::array<LONG,8> axisMinimum{{-10000,-10000,-10000,-10000,-10000,-10000,-10000,-10000}},axisMaximum{{10000,10000,10000,10000,10000,10000,10000,10000}};
 IDirectInputEffect *spring=nullptr,*damper=nullptr,*constant=nullptr;
 ~Device(){disarm();if(handle){handle->Unacquire();handle->Release();}}
 void stopEffects(){for(auto e:{spring,damper,constant})if(e){e->Stop();e->Unload();e->Release();}spring=damper=constant=nullptr;}
 void disarm(){
  if(!handle)return;
  bool changed=armed||exclusive;stopEffects();
  if(changed){handle->SendForceFeedbackCommand(DISFFC_STOPALL);handle->SendForceFeedbackCommand(DISFFC_RESET);}
  if(savedAutoCenter){auto p=property(oldAutoCenter);handle->SetProperty(DIPROP_AUTOCENTER,&p.diph);savedAutoCenter=false;}
  if(savedGain){auto p=property(oldGain);handle->SetProperty(DIPROP_FFGAIN,&p.diph);savedGain=false;}
  if(exclusive){handle->Unacquire();handle->SetCooperativeLevel(windowHandle,DISCL_BACKGROUND|DISCL_NONEXCLUSIVE);handle->Acquire();}
  armed=false;exclusive=false;
 }
 IDirectInputEffect *createEffect(const GUID &type,void *parameters,DWORD bytes){
  DWORD axis=forceAxis;LONG direction=10000;DIEFFECT effect{};effect.dwSize=sizeof(effect);effect.dwFlags=DIEFF_CARTESIAN|DIEFF_OBJECTOFFSETS;effect.dwDuration=250000;effect.dwGain=DI_FFNOMINALMAX;effect.dwTriggerButton=DIEB_NOTRIGGER;effect.cAxes=1;effect.rgdwAxes=&axis;effect.rglDirection=&direction;effect.cbTypeSpecificParams=bytes;effect.lpvTypeSpecificParams=parameters;
  IDirectInputEffect *result=nullptr;HRESULT hr=handle->CreateEffect(type,&effect,&result,nullptr);if(FAILED(hr))return nullptr;return result;
 }
 bool arm(){
  if(armed)return true;
  if(!connected||!capable||!hasActuator){status="No compatible force actuator";return false;}
  auto center=property(0);if(SUCCEEDED(handle->GetProperty(DIPROP_AUTOCENTER,&center.diph))){oldAutoCenter=center.dwData;savedAutoCenter=true;}
  auto gain=property(0);if(SUCCEEDED(handle->GetProperty(DIPROP_FFGAIN,&gain.diph))){oldGain=gain.dwData;savedGain=true;}
  handle->Unacquire();HRESULT hr=handle->SetCooperativeLevel(windowHandle,DISCL_BACKGROUND|DISCL_EXCLUSIVE);
  if(FAILED(hr)){status=hr_text(hr);disarm();return false;}exclusive=true;
  center=property(DIPROPAUTOCENTER_OFF);handle->SetProperty(DIPROP_AUTOCENTER,&center.diph);gain=property(10000);handle->SetProperty(DIPROP_FFGAIN,&gain.diph);
  hr=handle->Acquire();if(FAILED(hr)){status=hr_text(hr);disarm();return false;}handle->SendForceFeedbackCommand(DISFFC_RESET);handle->SendForceFeedbackCommand(DISFFC_SETACTUATORSON);
  DICONDITION springParams{};springParams.dwPositiveSaturation=springParams.dwNegativeSaturation=DI_FFNOMINALMAX;springParams.lDeadBand=180;
  DICONDITION damperParams{};damperParams.dwPositiveSaturation=damperParams.dwNegativeSaturation=DI_FFNOMINALMAX;
  DICONSTANTFORCE constantParams{};
  spring=createEffect(GUID_Spring,&springParams,sizeof(springParams));damper=createEffect(GUID_Damper,&damperParams,sizeof(damperParams));constant=createEffect(GUID_ConstantForce,&constantParams,sizeof(constantParams));
  if(!spring&&!constant){status="Driver does not expose spring or constant force";disarm();return false;}
  armed=true;status=spring?"Spring, road and impact feedback active":"Constant-force feedback active (spring fallback)";return true;
 }
 bool updateEffect(IDirectInputEffect *e,void *parameters,DWORD bytes){if(!e)return true;DIEFFECT p{};p.dwSize=sizeof(p);p.cbTypeSpecificParams=bytes;p.lpvTypeSpecificParams=parameters;HRESULT hr=e->SetParameters(&p,DIEP_TYPESPECIFICPARAMS|DIEP_START);if(FAILED(hr)){status=hr_text(hr);return false;}return true;}
 void force(const Feedback &f,double timeSeconds){
  if(!armed)return;
  auto out=compute_forces(f,timeSeconds);DICONDITION s{};s.lPositiveCoefficient=s.lNegativeCoefficient=out.spring;s.dwPositiveSaturation=s.dwNegativeSaturation=DWORD(5000*f.strength);s.lDeadBand=180;
  DICONDITION d{};d.lPositiveCoefficient=d.lNegativeCoefficient=out.damper;d.dwPositiveSaturation=d.dwNegativeSaturation=DWORD(1500*f.strength);
  DICONSTANTFORCE c{};c.lMagnitude=out.constant;
  // A standards-compatible constant-force-only driver still gets a restoring torque.
  if(!spring){DWORD offsets[]={DIJOFS_X,DIJOFS_Y,DIJOFS_Z,DIJOFS_RX,DIJOFS_RY,DIJOFS_RZ,DIJOFS_SLIDER(0),DIJOFS_SLIDER(1)};double position=axes[0];for(int i=0;i<8;i++)if(offsets[i]==forceAxis)position=axes[i];c.lMagnitude+=LONG(-position*out.spring);}
  c.lMagnitude=LONG(clamp(double(c.lMagnitude),-8000*f.strength,8000*f.strength));
  if(!updateEffect(spring,&s,sizeof(s))||!updateEffect(damper,&d,sizeof(d))||!updateEffect(constant,&c,sizeof(c)))disarm();
 }
 void poll(){
  if(!handle)return;
  HRESULT hr=handle->Poll();if(FAILED(hr)){for(int i=0;i<3;i++){hr=handle->Acquire();if(hr!=DIERR_INPUTLOST)break;}if(SUCCEEDED(hr))hr=handle->Poll();}
  DIJOYSTATE2 js{};if(FAILED(hr)||FAILED(handle->GetDeviceState(sizeof(js),&js))){connected=false;axes.fill(0);buttons.fill(0);if(armed)disarm();return;}
  connected=true;LONG values[]={js.lX,js.lY,js.lZ,js.lRx,js.lRy,js.lRz,js.rglSlider[0],js.rglSlider[1]};for(size_t i=0;i<8;i++)axes[i]=axisAvailable[i]?normalize_axis(values[i],axisMinimum[i],axisMaximum[i]):0;for(size_t i=0;i<128;i++)buttons[i]=(js.rgbButtons[i]&0x80)?1:0;
 }
};
std::vector<std::unique_ptr<Device>> devices;
BOOL CALLBACK enumObjects(const DIDEVICEOBJECTINSTANCEW *object,void *context){
 auto &d=*static_cast<Device*>(context);if(object->dwType&DIDFT_AXIS){DIPROPRANGE range{};range.diph.dwSize=sizeof(range);range.diph.dwHeaderSize=sizeof(range.diph);range.diph.dwObj=object->dwType;range.diph.dwHow=DIPH_BYID;range.lMin=-10000;range.lMax=10000;d.handle->SetProperty(DIPROP_RANGE,&range.diph);DWORD offsets[]={DIJOFS_X,DIJOFS_Y,DIJOFS_Z,DIJOFS_RX,DIJOFS_RY,DIJOFS_RZ,DIJOFS_SLIDER(0),DIJOFS_SLIDER(1)};d.handle->GetProperty(DIPROP_RANGE,&range.diph);for(int i=0;i<8;i++)if(object->dwOfs==offsets[i]){d.axisAvailable[i]=true;d.axisMinimum[i]=range.lMin;d.axisMaximum[i]=range.lMax;}}
 if(!d.hasActuator&&(object->dwFlags&DIDOI_FFACTUATOR)){d.hasActuator=true;d.forceAxis=object->dwOfs;}return DIENUM_CONTINUE;
}
BOOL CALLBACK enumDevices(const DIDEVICEINSTANCEW *info,void*){
 auto id=guid_string(info->guidInstance);for(const auto &d:devices)if(d->id==id)return DIENUM_CONTINUE;
 auto d=std::make_unique<Device>();d->guid=info->guidInstance;d->id=id;d->name=utf8(info->tszInstanceName);if(FAILED(directInput->CreateDevice(info->guidInstance,&d->handle,nullptr)))return DIENUM_CONTINUE;
 if(FAILED(d->handle->SetDataFormat(&c_dfDIJoystick2))||FAILED(d->handle->SetCooperativeLevel(windowHandle,DISCL_BACKGROUND|DISCL_NONEXCLUSIVE)))return DIENUM_CONTINUE;
 DIDEVCAPS caps{};caps.dwSize=sizeof(caps);if(SUCCEEDED(d->handle->GetCapabilities(&caps)))d->capable=(caps.dwFlags&DIDC_FORCEFEEDBACK)!=0;
 d->handle->EnumObjects(enumObjects,d.get(),DIDFT_ALL);d->handle->Acquire();d->poll();d->status=d->capable?"Ready; force feedback is off":"Input only";
 std::cout<<"Connected: "<<d->name<<(d->capable?" [force feedback]":"")<<"\n";devices.push_back(std::move(d));return DIENUM_CONTINUE;
}
std::string makeSnapshot(const Feedback &f,bool watchdog,bool emergency){
 std::ostringstream o;o<<std::fixed<<std::setprecision(4)<<"{\"bridge\":\"ridgebound-directinput\",\"version\":1,\"devices\":[";bool first=true,available=false,armed=false;std::string status=watchdog?"No recent telemetry; feedback stopped":"Force feedback is off";
 for(size_t n=0;n<devices.size();n++){const auto &d=*devices[n];if(!first)o<<',';first=false;o<<"{\"id\":"<<json_string(d.id)<<",\"name\":"<<json_string(d.name)<<",\"index\":"<<n<<",\"connected\":"<<(d.connected?"true":"false")<<",\"forceFeedback\":"<<(d.capable&&d.hasActuator?"true":"false")<<",\"axes\":[";for(size_t i=0;i<8;i++){if(i)o<<',';o<<d.axes[i];}o<<"],\"buttons\":[";for(size_t i=0;i<128;i++){if(i)o<<',';o<<d.buttons[i];}o<<"],\"axisNames\":[\"X\",\"Y\",\"Z\",\"Rx\",\"Ry\",\"Rz\",\"Slider0\",\"Slider1\"],\"axisAvailable\":[";for(size_t i=0;i<8;i++){if(i)o<<',';o<<(d.axisAvailable[i]?"true":"false");}o<<"]}";available|=d.capable&&d.hasActuator&&d.connected;armed|=d.armed;if(d.armed||(f.enabled&&d.capable))status=d.status;}
 if(emergency)status="F8 emergency stop; turn feedback off, then enable again";
 o<<"],\"ffb\":{\"available\":"<<(available?"true":"false")<<",\"armed\":"<<(armed?"true":"false")<<",\"strength\":"<<f.strength<<",\"status\":"<<json_string(status)<<",\"watchdogMs\":500,\"maxStrength\":0.6}}";return o.str();
}
bool sendAll(SOCKET socket,const char *data,size_t size){while(size){int n=send(socket,data,int(std::min<size_t>(size,65536)),0);if(n<=0)return false;data+=n;size-=n;}return true;}
void response(SOCKET s,int status,const std::string &type,const std::string &body,bool head=false){const char *reason=status==200?"OK":status==400?"Bad Request":status==403?"Forbidden":status==404?"Not Found":status==405?"Method Not Allowed":status==413?"Payload Too Large":"Service Unavailable";std::string h="HTTP/1.1 "+std::to_string(status)+" "+reason+"\r\nContent-Type: "+type+"\r\nContent-Length: "+std::to_string(body.size())+"\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nCross-Origin-Resource-Policy: same-origin\r\nConnection: close\r\n\r\n";sendAll(s,h.data(),h.size());if(!head)sendAll(s,body.data(),body.size());}
bool underRoot(const fs::path &p){auto r=webRoot.begin(),f=p.begin();for(;r!=webRoot.end();++r,++f)if(f==p.end()||_wcsicmp(r->c_str(),f->c_str())!=0)return false;return true;}
void serveFile(SOCKET s,const std::string &uri,bool head){
 std::string rel;if(!safe_relative_path(uri,rel)){response(s,403,"text/plain","Path rejected");return;}std::error_code ec;auto file=fs::weakly_canonical(webRoot/fs::u8path(rel),ec);if(ec||!underRoot(file)||!fs::is_regular_file(file,ec)){response(s,404,"text/plain","File not found");return;}auto size=fs::file_size(file,ec);if(ec){response(s,404,"text/plain","File not found");return;}
 std::ifstream in(file,std::ios::binary);if(!in){response(s,404,"text/plain","File not found");return;}std::string h="HTTP/1.1 200 OK\r\nContent-Type: "+mime_type(rel)+"\r\nContent-Length: "+std::to_string(size)+"\r\nX-Content-Type-Options: nosniff\r\nCross-Origin-Resource-Policy: same-origin\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n";if(!sendAll(s,h.data(),h.size())||head)return;std::array<char,65536> data{};while(running&&in){in.read(data.data(),data.size());auto n=in.gcount();if(n&&!sendAll(s,data.data(),size_t(n)))break;}
}
void client(SOCKET s){
 struct Close{SOCKET s;~Close(){shutdown(s,SD_BOTH);closesocket(s);--activeClients;}} close{s};DWORD timeout=3000;setsockopt(s,SOL_SOCKET,SO_RCVTIMEO,reinterpret_cast<const char*>(&timeout),sizeof(timeout));setsockopt(s,SOL_SOCKET,SO_SNDTIMEO,reinterpret_cast<const char*>(&timeout),sizeof(timeout));
 std::string request;std::array<char,4096> buf{};size_t end=std::string::npos;while((end=request.find("\r\n\r\n"))==std::string::npos){int n=recv(s,buf.data(),buf.size(),0);if(n<=0)return;request.append(buf.data(),n);if(request.size()>16384){response(s,413,"text/plain","Headers too large");return;}}
 std::istringstream lines(request.substr(0,end));std::string first,method,uri,version;std::getline(lines,first);std::istringstream line(first);line>>method>>uri>>version;if(version!="HTTP/1.1"&&version!="HTTP/1.0"){response(s,400,"text/plain","Invalid request");return;}
 std::map<std::string,std::string> headers;std::string raw;while(std::getline(lines,raw)){auto colon=raw.find(':');if(colon==std::string::npos){response(s,400,"text/plain","Invalid header");return;}auto key=lower(trim(raw.substr(0,colon)));if(headers.count(key)){response(s,400,"text/plain","Duplicate header");return;}headers[key]=trim(raw.substr(colon+1));}
 if(!allowed_host(headers["host"])||(headers.count("origin")&&!allowed_origin(headers["origin"]))){response(s,403,"text/plain","Local origin required");return;}
 if(headers.count("transfer-encoding")){response(s,400,"text/plain","Transfer encoding not supported");return;}
 auto api=uri.substr(0,uri.find('?'));
 if(api=="/api/input"||api=="/api/devices"){if(method!="GET"){response(s,405,"text/plain","GET required");return;}std::string state;{std::lock_guard<std::mutex> lock(stateMutex);state=snapshot;}response(s,200,"application/json",state);return;}
 if(api=="/api/feedback"){
  if(method!="POST"){response(s,405,"text/plain","POST required");return;}
  if(!allowed_origin(headers["origin"])||lower(headers["content-type"]).find("application/json")!=0){response(s,403,"text/plain","Same-origin JSON required");return;}
  size_t length=0;try{const auto &n=headers.at("content-length");if(n.empty()||n.find_first_not_of("0123456789")!=std::string::npos)throw 0;length=std::stoul(n);}catch(...){response(s,400,"text/plain","Content-Length required");return;}if(length>4096){response(s,413,"text/plain","Feedback too large");return;}
  std::string body=request.substr(end+4);while(body.size()<length){int n=recv(s,buf.data(),int(std::min<size_t>(buf.size(),length-body.size())),0);if(n<=0)return;body.append(buf.data(),n);}if(body.size()!=length){response(s,400,"text/plain","Invalid body length");return;}
  Feedback f;if(!parse_feedback(body,f)){response(s,400,"application/json",R"({"ok":false,"error":"Invalid telemetry"})");return;}
  {std::lock_guard<std::mutex> lock(stateMutex);if(!f.enabled)emergencyLatched=false;if(emergencyLatched)f.enabled=false;feedback=std::move(f);feedbackAt=Clock::now();}
  response(s,200,"application/json",R"({"ok":true})");return;
 }
 if(method!="GET"&&method!="HEAD"){response(s,405,"text/plain","GET or HEAD required");return;}serveFile(s,uri,method=="HEAD");
}
void server(){while(running){sockaddr_in peer{};int size=sizeof(peer);SOCKET s=accept(listener,reinterpret_cast<sockaddr*>(&peer),&size);if(s==INVALID_SOCKET){if(running)std::this_thread::sleep_for(std::chrono::milliseconds(10));continue;}if(ntohl(peer.sin_addr.s_addr)!=INADDR_LOOPBACK||activeClients.load()>=24){closesocket(s);continue;}++activeClients;std::thread([s]{try{client(s);}catch(const std::exception &e){std::cerr<<"Request rejected: "<<e.what()<<"\n";}catch(...){std::cerr<<"Request rejected.\n";}}).detach();}}
BOOL WINAPI consoleControl(DWORD event){if(event==CTRL_C_EVENT||event==CTRL_BREAK_EVENT||event==CTRL_CLOSE_EVENT){running=false;return TRUE;}return FALSE;}
LRESULT CALLBACK windowProc(HWND hwnd,UINT message,WPARAM wp,LPARAM lp){if(message==WM_CLOSE){running=false;return 0;}if(message==WM_DESTROY){PostQuitMessage(0);return 0;}return DefWindowProcW(hwnd,message,wp,lp);}
}
int wmain(int argc,wchar_t **argv){
 SetConsoleOutputCP(CP_UTF8);std::cout<<"Ridgebound / 山野之间 - Windows DirectInput bridge\n";
 wchar_t exe[MAX_PATH]{};GetModuleFileNameW(nullptr,exe,MAX_PATH);fs::path base=fs::path(exe).parent_path();webRoot=base/L"web";bool browser=true;
 for(int i=1;i<argc;i++){std::wstring arg=argv[i];if(arg==L"--web-root"&&i+1<argc)webRoot=argv[++i];else if(arg==L"--no-browser")browser=false;else if(arg==L"--help"){std::cout<<"Usage: ridgebound-wheel-bridge.exe [--web-root PATH] [--no-browser]\n";return 0;}else {std::cerr<<"Unknown option. Use --help.\n";return 2;}}
 std::error_code ec;webRoot=fs::weakly_canonical(webRoot,ec);if(ec||!fs::is_regular_file(webRoot/L"index.html")){std::cerr<<"Cannot find web/index.html. Extract the complete Windows package,\nthen launch Start-Ridgebound.bat (or specify --web-root).\n";return 2;}
 CoInitializeEx(nullptr,COINIT_MULTITHREADED);SetConsoleCtrlHandler(consoleControl,TRUE);WNDCLASSW wc{};wc.lpfnWndProc=windowProc;wc.hInstance=GetModuleHandleW(nullptr);wc.lpszClassName=L"RidgeboundInputBridge";RegisterClassW(&wc);windowHandle=CreateWindowExW(0,wc.lpszClassName,L"Ridgebound input bridge",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,360,100,nullptr,nullptr,wc.hInstance,nullptr);
 if(!windowHandle||FAILED(DirectInput8Create(wc.hInstance,DIRECTINPUT_VERSION,IID_IDirectInput8W,reinterpret_cast<void**>(&directInput),nullptr))){std::cerr<<"DirectInput initialization failed. Install the manufacturer's device driver.\n";return 3;}
 WSADATA wsa{};if(WSAStartup(MAKEWORD(2,2),&wsa)){std::cerr<<"Windows sockets unavailable.\n";return 4;}listener=socket(AF_INET,SOCK_STREAM,IPPROTO_TCP);BOOL exclusive=TRUE;setsockopt(listener,SOL_SOCKET,SO_EXCLUSIVEADDRUSE,reinterpret_cast<const char*>(&exclusive),sizeof(exclusive));sockaddr_in addr{};addr.sin_family=AF_INET;addr.sin_port=htons(kPort);addr.sin_addr.s_addr=htonl(INADDR_LOOPBACK);
 if(bind(listener,reinterpret_cast<sockaddr*>(&addr),sizeof(addr))==SOCKET_ERROR||listen(listener,16)==SOCKET_ERROR){std::cerr<<"Port 8766 is already used. Close the other bridge instance.\n";closesocket(listener);listener=INVALID_SOCKET;devices.clear();directInput->Release();DestroyWindow(windowHandle);WSACleanup();CoUninitialize();return 4;}
 std::thread http(server);std::cout<<"Local game: "<<origin<<"/\nForce feedback starts OFF. Enable it explicitly in controller settings.\nDefault strength 35%; maximum 60%; stale telemetry stops forces after 500 ms.\nF8 = emergency force stop. Ctrl+C = close bridge and restore device defaults.\n";
 if(browser)ShellExecuteW(nullptr,L"open",L"http://127.0.0.1:8766/",nullptr,nullptr,SW_SHOWNORMAL);
 auto began=Clock::now(),lastEnumeration=Clock::time_point::min();bool f8was=false;Clock::time_point retryAfter{};
 while(running){
  auto now=Clock::now();MSG msg{};while(PeekMessageW(&msg,nullptr,0,0,PM_REMOVE)){if(msg.message==WM_QUIT)running=false;TranslateMessage(&msg);DispatchMessageW(&msg);}
  if(lastEnumeration==Clock::time_point::min()||now-lastEnumeration>std::chrono::seconds(3)){directInput->EnumDevices(DI8DEVCLASS_GAMECTRL,enumDevices,nullptr,DIEDFL_ATTACHEDONLY);lastEnumeration=now;}
  bool f8=(GetAsyncKeyState(VK_F8)&0x8000)!=0;if(f8&&!f8was){std::lock_guard<std::mutex> lock(stateMutex);feedback.enabled=false;emergencyLatched=true;std::cout<<"Emergency force stop. Toggle feedback off then on to re-enable.\n";}f8was=f8;
  Feedback f;Clock::time_point at;bool emergency;{std::lock_guard<std::mutex> lock(stateMutex);f=feedback;at=feedbackAt;emergency=emergencyLatched;}
  bool watchdog=at==Clock::time_point::min()||now-at>std::chrono::milliseconds(kWatchdogMs);if(watchdog||emergency)f.enabled=false;
  Device *selected=nullptr;for(auto &d:devices){d->poll();if(d->connected&&d->capable&&d->hasActuator&&!selected&&(f.deviceId.empty()||d->id==f.deviceId))selected=d.get();}
  for(auto &d:devices){if(!f.enabled||d.get()!=selected){if(d->armed||d->exclusive)d->disarm();continue;}if(!d->armed&&now>=retryAfter){if(!d->arm())retryAfter=now+std::chrono::seconds(2);}if(d->armed)d->force(f,std::chrono::duration<double>(now-began).count());}
  {std::lock_guard<std::mutex> lock(stateMutex);snapshot=makeSnapshot(f,watchdog,emergency);}
  std::this_thread::sleep_for(std::chrono::milliseconds(16));
 }
 for(auto &d:devices)d->disarm();
 shutdown(listener,SD_BOTH);closesocket(listener);listener=INVALID_SOCKET;if(http.joinable())http.join();while(activeClients.load()>0)std::this_thread::sleep_for(std::chrono::milliseconds(10));devices.clear();directInput->Release();DestroyWindow(windowHandle);WSACleanup();CoUninitialize();std::cout<<"Stopped. Device defaults restored.\n";return 0;
}
