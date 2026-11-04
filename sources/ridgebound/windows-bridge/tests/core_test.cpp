// SPDX-License-Identifier: MIT
#include "../core.hpp"
#include <cassert>
#include <iostream>
using namespace ridgebound;
int main(){
 assert(normalize_axis(0,0,65535)==-1);assert(normalize_axis(65535,0,65535)==1);assert(normalize_axis(0,-10000,10000)==0);assert(normalize_axis(99,1,1)==0);
 Feedback f;assert(parse_feedback(R"({"enabled":true,"strength":5,"speed":15,"slip":0.4,"deviceId":"di:test"})",f));assert(f.enabled&&f.strength==.6&&f.deviceId=="di:test");
 assert(!parse_feedback(R"({"enabled":true,"enabled":false})",f));assert(!parse_feedback(R"({"enabled":1})",f));assert(!parse_feedback(R"({"enabled":true,"speed":1e9999})",f));assert(!parse_feedback(R"({"enabled":true,"speed":NaN})",f));assert(!parse_feedback(R"({"enabled":true}junk)",f));assert(!parse_feedback(R"({"enabled":true,"strength":0.5,})",f));
 assert(parse_feedback(R"({"enabled":false})",f));auto zero=compute_forces(f,10);assert(zero.spring==0&&zero.damper==0&&zero.constant==0);
 assert(parse_feedback(R"({"enabled":true,"strength":1,"speed":120,"slip":0,"impact":1,"suspension":1})",f));for(int i=0;i<10000;i++){auto o=compute_forces(f,i*.01);assert(o.spring>=0&&o.spring<=6000);assert(o.damper>=0&&o.damper<=6000);assert(std::abs(o.constant)<=1800);assert(o.spring+o.damper+std::abs(o.constant)<=6000);}
 std::string p;assert(safe_relative_path("/engine/game.wasm?x=1",p)&&p=="engine/game.wasm");assert(safe_relative_path("/",p)&&p=="index.html");assert(!safe_relative_path("/../secret",p));assert(!safe_relative_path("/%2e%2e/secret",p));assert(!safe_relative_path("/%2f..%2fsecret",p));assert(!safe_relative_path("/C:/secret",p));assert(!safe_relative_path("/a%5c..%5csecret",p));assert(!safe_relative_path("/a%00.txt",p));assert(!safe_relative_path("/COM1.txt",p));assert(!safe_relative_path("/folder./a",p));assert(!safe_relative_path("/x%zz",p));
 assert(allowed_host("127.0.0.1:8766"));assert(!allowed_host("evil.example:8766"));assert(allowed_origin("http://127.0.0.1:8766"));assert(!allowed_origin("https://evil.example"));assert(!allowed_origin("null"));assert(mime_type("game.wasm")=="application/wasm");
 std::cout<<"All bridge parser, force bounds, path and origin tests passed.\n";
}
