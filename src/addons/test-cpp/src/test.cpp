#define EXPORT_FUNCTION(function_name) exports[#function_name] = Function::New<Callback>(env, function_name);
#define EXPORT_FUNCTION_VOID(function_name) exports[#function_name] = Function::New<VoidCallback>(env, function_name);



#include "napi.h"



using namespace Napi;

Value getString (const CallbackInfo& info)
{
	return String::New(info.Env(), "Hello, World!");
}

Object Init (Env env, Object exports)
{
	using Callback = Value (*) (const CallbackInfo&);
	using VoidCallback = void (*) (const CallbackInfo&);

	EXPORT_FUNCTION(getString);

	return exports;
}

NODE_API_MODULE(test_cpp, Init)
