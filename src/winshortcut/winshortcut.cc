#include <node.h>
#include <v8.h>
#include <comdef.h>
#include <memory>
#include <windows.h>
#include <shobjidl.h>
#include <objbase.h>
#include <shlobj.h>
#include <shellapi.h>
#include <shobjidl_core.h>
#include <string>
#include <iostream>
#include "property_store.h"
#include <propvarutil.h>

using namespace node;
using namespace v8;

// https://learn.microsoft.com/en-us/previous-versions/windows/desktop/indexsrv/psguid-audio
GUID g__AUDIO = PSGUID_AUDIO;   // defined shiguid.h
GUID g__VIDEO = PSGUID_VIDEO;   // defined shiguid.h
GUID g__MUSIC = PSGUID_MUSIC;   // defined shiguid.h
GUID g__MEDIAFILESUMMARYINFORMATION = PSGUID_MEDIAFILESUMMARYINFORMATION;   // defined shiguid.h
GUID g__SUMMARYINFORMATION = PSGUID_SUMMARYINFORMATION;   // defined shiguid.h
GUID g_FMTID_Storage = FMTID_Storage;
GUID g_PSGUID_DOCUMENTSUMMARYINFORMATION = PSGUID_DOCUMENTSUMMARYINFORMATION;
GUID g_PSGUID_MISC = PSGUID_MISC;
GUID g_PSGUID_SHELLDETAILS = PSGUID_SHELLDETAILS;
GUID g_PSGUID_IMAGESUMMARYINFORMATION = PSGUID_IMAGESUMMARYINFORMATION;


void ThrowTypeError(v8::Isolate *isolate, const char *msg)
{
    size_t msgSize = std::strlen(msg);
    v8::Local<v8::String> v8Msg =
        v8::String::NewFromUtf8(isolate, msg, v8::NewStringType::kNormal, static_cast<int>(msgSize)).ToLocalChecked();

    // Throw an Error that is passed back to JavaScript
    isolate->ThrowException(v8::Exception::TypeError(v8Msg));
}

// Gets unicode character at the specified index from the argument of FunctionCallbackInfo
wchar_t *getArgvString(
    Isolate *isolate,
    v8::Local<v8::Context> &context,
    int index,
    const FunctionCallbackInfo<Value> &args,
    bool &bError)
{
    wchar_t *pRet = NULL;
    bError = true;

    if (args.Length() < index + 1)
    {
        ThrowTypeError(isolate, "Wrong number of arguments");
        return NULL;
    }
    if (args[index]->IsString() == false)
    {
        ThrowTypeError(isolate, "arg1 is invalid type.");
        return NULL;
    }

    // To Local
    MaybeLocal<v8::String> strMaybeLocalStr = args[index]->ToString(context);
    v8::Local<v8::String> localStringStr;
    if (strMaybeLocalStr.ToLocal(&localStringStr) == false)
    {
        ThrowTypeError(isolate, "invalid type.");
        return NULL;
    }
    // To Primitive
    v8::String::Value unicodeValueStr(context->GetIsolate(), localStringStr);
    const uint16_t *primitiveStr = *unicodeValueStr;
    pRet = new wchar_t[wcslen((wchar_t *)primitiveStr) + 1];
    if (pRet == NULL)
    {
        ThrowTypeError(isolate, "memory allocate error.");
        return NULL;
    }
    wcscpy(pRet, (wchar_t *)primitiveStr);

    bError = false;
    return pRet;
}

// Gets uinit32 at the specified index from the argument of FunctionCallbackInfo
uint32_t getArgvUint32(
    Isolate *isolate,
    v8::Local<v8::Context> &context,
    int index,
    const FunctionCallbackInfo<Value> &args,
    bool &bError)
{
    uint32_t retVal = 0;
    bError = true;

    if (args.Length() < index + 1)
    {
        ThrowTypeError(isolate, "Wrong number of arguments");
        return retVal;
    }
    if (args[index]->IsUint32() == false)
    {
        ThrowTypeError(isolate, "arg1 is invalid type.");
        return retVal;
    }

    // To Local
    MaybeLocal<v8::Uint32> maybeLocal = args[index]->ToUint32(context);
    v8::Local<v8::Uint32> localValue;
    if (maybeLocal.ToLocal(&localValue) == false)
    {
        ThrowTypeError(isolate, "invalid type.");
        return retVal;
    }
    // To Primitive
    retVal = localValue->Value();

    bError = false;
    return retVal;
}

// Given a shortcut path, get the path of the link destination
void getAbsoltePath(const FunctionCallbackInfo<Value> &args)
{
    bool bError = false;
    Isolate *isolate = args.GetIsolate();
    v8::Local<v8::Context> context = v8::Context::New(v8::Isolate::GetCurrent());


    std::unique_ptr<wchar_t> upFilePath;
    upFilePath = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 0, args, bError));
    if (upFilePath.get() == NULL)
    {
        return ;
    }
    if (bError == true)
    {
        return ;
    }

    //IShellLinkW *pShellLink = NULL;
    IShellLinkW* pShellLink;
    HRESULT hr = CoCreateInstance(CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, IID_IShellLinkW, (LPVOID *)&pShellLink);
    if (!SUCCEEDED(hr))
    {
        ThrowTypeError(isolate, "fail to CoCreateInstance.");
        return;
    }
    IPersistFile *pPersistFile;
    hr = pShellLink->QueryInterface(IID_IPersistFile, (LPVOID *)&pPersistFile);
    if (!SUCCEEDED(hr))
    {
        ThrowTypeError(isolate, "fail to QueryInterface.");
        pShellLink->Release();
        return;
    }

    LPCWSTR shortcutPath = (LPCWSTR)upFilePath.get();
    hr = pPersistFile->Load(shortcutPath, STGM_READ);
    if (!SUCCEEDED(hr))
    {
        ThrowTypeError(isolate, "fail to Load.");
        pPersistFile->Release();
        pShellLink->Release();
        return;
    }
    WCHAR targetPath[MAX_PATH];
    WIN32_FIND_DATAW findData;
    hr = pShellLink->GetPath(targetPath, MAX_PATH, &findData, SLGP_RAWPATH);
    pPersistFile->Release();
    pShellLink->Release();
    if (!SUCCEEDED(hr))
    {
        ThrowTypeError(isolate, "fail to GetPath.");
        return;
    }

    HandleScope scope(isolate);
    Local<v8::String> result;
    MaybeLocal<v8::String> str = String::NewFromTwoByte(isolate, (const uint16_t *)targetPath);
    str.ToLocal(&result);
    args.GetReturnValue().Set(result);
}

// Change the destination path of the shortcut.
void setAbsoltePath(const FunctionCallbackInfo<Value> &args)
{
    bool bError = false;
    Isolate *isolate = args.GetIsolate();
    v8::Local<v8::Context> context = v8::Context::New(v8::Isolate::GetCurrent());



    std::unique_ptr<wchar_t> upFilePath;
    upFilePath = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 0, args, bError));
    if (upFilePath.get() == NULL)
    {
        return ;
    }
    if (bError == true)
    {
        return ;
    }

    std::unique_ptr<wchar_t> upFilePathDst;
    upFilePathDst = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 1, args, bError));
    if (upFilePath.get() == NULL)
    {
        return ;
    }
    if (bError == true)
    {
        return ;
    }


    IShellLinkW *pShellLink = NULL;
    HRESULT hr = CoCreateInstance(CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, IID_IShellLinkW, (LPVOID *)&pShellLink);
    if (!SUCCEEDED(hr))
    {
        ThrowTypeError(isolate, "fail to CoCreateInstance.");
        return;
    }
    IPersistFile *pPersistFile;
    hr = pShellLink->QueryInterface(IID_IPersistFile, (LPVOID *)&pPersistFile);
    if (!SUCCEEDED(hr))
    {
        ThrowTypeError(isolate, "fail to QueryInterface.");
        pShellLink->Release();
        return;
    }

    LPCWSTR shortcutPath = (LPCWSTR)upFilePath.get();
    hr = pPersistFile->Load(shortcutPath, STGM_READ);
    if (!SUCCEEDED(hr))
    {
        ThrowTypeError(isolate, "fail to Load.");
        pPersistFile->Release();
        pShellLink->Release();
        return;
    }
    hr = pShellLink->SetPath((LPCWSTR)upFilePathDst.get());
    if (!SUCCEEDED(hr))
    {
        pPersistFile->Release();
        pShellLink->Release();
        ThrowTypeError(isolate, "fail to SetPath.");
        return;
    }
    hr = pPersistFile->Save(shortcutPath, TRUE);
    pPersistFile->Release();
    pShellLink->Release();
    if (!SUCCEEDED(hr))
    {
        ThrowTypeError(isolate, "fail to Save.");
        return;
    }

    args.GetReturnValue().Set(true);
}



// ファイル、ディレクトリのプロパティ場面をオープンします。
void openShellProperty(const FunctionCallbackInfo<Value> &args)
{
    SHELLEXECUTEINFOW sei;
    bool bError = false;
    Isolate *isolate = args.GetIsolate();
    v8::Local<v8::Context> context = v8::Context::New(v8::Isolate::GetCurrent());

    std::unique_ptr<wchar_t> upFilePath;
    upFilePath = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 0, args, bError));
    if (upFilePath.get() == NULL)
    {
        return ;
    }
    if (bError == true)
    {
        return ;
    }
    LPCWSTR shortcutPath = (LPCWSTR)upFilePath.get();
    memset (&sei, 0x00, sizeof(sei));
    sei.cbSize = sizeof (SHELLEXECUTEINFOW);
    sei.fMask = SEE_MASK_NOCLOSEPROCESS | SEE_MASK_INVOKEIDLIST;//|SEE_MASK_FLAG_NO_UI;
    sei.hwnd = NULL;
    sei.lpVerb = L"properties";//プロパティダイアログを開くオプション。
    sei.lpFile = shortcutPath;
    sei.lpParameters = NULL;//lpFileに関連づくコマンドパラメータを指定する。
    sei.lpDirectory = NULL;//findで検索対象となるディレクトリ。
    sei.nShow = SW_SHOWNORMAL;//アプリケーションを表示する場合は1を指定する。
    sei.hInstApp = 0;//戻り値が0の場合に結果となる原因コードが格納されます。
    //GetLastErroの値とは異なります。
    sei.lpIDList = 0;
    //アイテムIDリスト。詳細は各自にて。
    sei.lpClass = NULL;
    sei.hkeyClass = NULL;
    sei.dwHotKey = 0;
    sei.hIcon = NULL;
    sei.hProcess = NULL;//新しいプロセスのプロセルハンドルが格納される。
    boolean bRet = false;
    if( ::ShellExecuteExW(&sei) == FALSE )
    {
    } else {
      if( (int)sei.hInstApp > 32 ){
        bRet = true;
      }
    }
    args.GetReturnValue().Set(bRet);
}


// 指定されたファイルをオープンします。
void openShellOpen(const FunctionCallbackInfo<Value> &args)
{
    SHELLEXECUTEINFOW sei;
    bool bError = false;
    Isolate *isolate = args.GetIsolate();
    v8::Local<v8::Context> context = v8::Context::New(v8::Isolate::GetCurrent());

    std::unique_ptr<wchar_t> upFilePath;
    upFilePath = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 0, args, bError));
    if (upFilePath.get() == NULL)
    {
        return ;
    }
    if (bError == true)
    {
        return ;
    }
    LPCWSTR shortcutPath = (LPCWSTR)upFilePath.get();
    memset (&sei, 0x00, sizeof(sei));
    sei.cbSize = sizeof (SHELLEXECUTEINFOW);
    sei.fMask = SEE_MASK_NOCLOSEPROCESS | SEE_MASK_INVOKEIDLIST;//|SEE_MASK_FLAG_NO_UI;
    sei.hwnd = NULL;
    sei.lpVerb = L"open";
    sei.lpFile = shortcutPath;
    sei.lpParameters = NULL;//lpFileに関連づくコマンドパラメータを指定する。
    sei.lpDirectory = NULL;//findで検索対象となるディレクトリ。
    sei.nShow = SW_SHOWNORMAL;//アプリケーションを表示する場合は1を指定する。
    sei.hInstApp = 0;//戻り値が0の場合に結果となる原因コードが格納されます。
    //GetLastErroの値とは異なります。
    sei.lpIDList = 0;
    //アイテムIDリスト。詳細は各自にて。
    sei.lpClass = NULL;
    sei.hkeyClass = NULL;
    sei.dwHotKey = 0;
    sei.hIcon = NULL;
    sei.hProcess = NULL;//新しいプロセスのプロセルハンドルが格納される。
    boolean bRet = false;
    if( ::ShellExecuteExW(&sei) == FALSE )
    {
    } else {
      if( (int)sei.hInstApp > 32 ){
        bRet = true;
      }
    }
    args.GetReturnValue().Set(bRet);
}

enum EM_DATA_TYPE
{
        EM_DATA_TYPE_U4
   ,    EM_DATA_TYPE_U2
   ,    EM_DATA_TYPE_U1
   ,    EM_DATA_TYPE_R8
    ,   EM_DATA_TYPE_LPCWSTR
    ,   EM_DATA_TYPE_BSTR
    ,   EM_DATA_TYPE_VECTOR_LPCWSTR
};



// v8::Local<v8::Value>からuint32型の値を取り出し、指定したプロパティー値にセットします。
bool getPropUint4(
    v8::Isolate* isolate,
    v8::Local<v8::Context> context,
    IPropertyStore *pPropertyStore,
    Local<Object> obj,
    const char* pKey,
    GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType)
{

    v8::Local<v8::String> propName;
    size_t msgSize = 0;

    msgSize = std::strlen(pKey);
    propName = v8::String::NewFromUtf8(isolate,  pKey , v8::NewStringType::kNormal, static_cast<int>(msgSize)).ToLocalChecked();

    PROPVARIANT var;
    if (getpPropertyStoreValue(pPropertyStore, pGuid, dwPid, var) == false)
    {
        ThrowTypeError(isolate, "fail to getpPropertyStoreValue.");
        return false;
    }
    if (var.vt == VT_EMPTY)
    {
        // dose not set property.
        obj->Set(context, propName, Undefined(isolate));
        return true;
    }
    if (var.vt == VT_UI4)
    {
        v8::Local<v8::Integer> v = v8::Integer::NewFromUnsigned(isolate, var.ulVal);
        obj->Set(context, propName, v);
    }
    if (var.vt == VT_UI2)
    {
        v8::Local<v8::Integer> v = v8::Integer::NewFromUnsigned(isolate, var.uiVal);
        obj->Set(context, propName, v);
    }
    if (var.vt == VT_UI1)
    {
        v8::Local<v8::Integer> v = v8::Integer::NewFromUnsigned(isolate, var.bVal);
        obj->Set(context, propName, v);
    }
    PropVariantClear(&var);
    return true;
}
bool setPropUint4(
    v8::Isolate* isolate,
    v8::Local<v8::Context> context,
    IPropertyStore *pPropertyStore,

    v8::Local<v8::Value> &value, GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType)
{
    bool bRet = false;

    if( value->IsUint32() == false )
    {
        return false;
    }
    // To Local
    MaybeLocal<v8::Uint32> maybeLocal = value->ToUint32(context);
    v8::Local<v8::Uint32> localValue;
    if (maybeLocal.ToLocal(&localValue) == false)
    {
        ThrowTypeError(isolate, "invalid type.");
        return false;
    }
    // To Primitive
    uint32_t retVal = localValue->Value();

    PROPVARIANT var;
    PropVariantInit(&var);
    if( emType == EM_DATA_TYPE_U4)
    {
        var.vt = VT_UI4;
        var.ulVal = (USHORT)retVal;
    }
    else if( emType == EM_DATA_TYPE_U2)
    {
        var.vt = VT_UI2;
        var.uiVal = (USHORT)retVal;
    }
    else
    {
        var.vt = VT_UI1;
        var.bVal = (UCHAR)retVal;
    }
    bRet = setpPropertyStoreValue(pPropertyStore, pGuid, dwPid, var);
    PropVariantClear(&var);

    return bRet;
}


bool getPropReal8(
    v8::Isolate* isolate,
    v8::Local<v8::Context> context,
    IPropertyStore *pPropertyStore,
    Local<Object> obj,
    const char* pKey,
    GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType)
{

    v8::Local<v8::String> propName;
    size_t msgSize = 0;

    msgSize = std::strlen(pKey);
    propName = v8::String::NewFromUtf8(isolate,  pKey , v8::NewStringType::kNormal, static_cast<int>(msgSize)).ToLocalChecked();

    PROPVARIANT var;
    if (getpPropertyStoreValue(pPropertyStore, pGuid, dwPid, var) == false)
    {
        ThrowTypeError(isolate, "fail to getpPropertyStoreValue.");
        return false;
    }
    if (var.vt == VT_EMPTY)
    {
        // dose not set property.
        obj->Set(context, propName, Undefined(isolate));
        return true;
    }
    if (var.vt == VT_R8)
    {
        v8::Local<v8::Number> v = v8::Number::New(isolate, var.dblVal);
        obj->Set(context, propName, v);
    }
    PropVariantClear(&var);
    return true;
}

// v8::Local<v8::Value>からLPWSTR型の値を取り出し、指定したプロパティー値にセットします。
bool getPropLPWSTR(
    v8::Isolate* isolate,
    v8::Local<v8::Context> context,
    IPropertyStore *pPropertyStore,
    Local<Object> obj,
    const char* pKey,
    GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType)
{
    v8::Local<v8::String> propName;
    size_t msgSize = 0;

    msgSize = std::strlen(pKey);
    propName = v8::String::NewFromUtf8(isolate,  pKey , v8::NewStringType::kNormal, static_cast<int>(msgSize)).ToLocalChecked();

    PROPVARIANT var;
    if (getpPropertyStoreValue(pPropertyStore, pGuid, dwPid, var) == false)
    {
        ThrowTypeError(isolate, "fail to getpPropertyStoreValue.");
        return false;
    }
    if (var.vt == VT_EMPTY)
    {
        // dose not set property.
        obj->Set(context, propName, Undefined(isolate));
        return true;
    }
    if ( !(var.vt == VT_LPWSTR || var.vt == VT_BSTR) )
    {
        // dose not set property.
        obj->Set(context, propName, Undefined(isolate));
        return true;
    }


    HandleScope scope(isolate);
    Local<v8::String> result;
    MaybeLocal<v8::String> str = String::NewFromTwoByte(isolate, (const uint16_t *)var.pwszVal);
    str.ToLocal(&result);
    obj->Set(context, propName, result);
    PropVariantClear(&var);
    return true;
}
bool setPropLPWSTR(
    v8::Isolate* isolate,
    v8::Local<v8::Context> context,
    IPropertyStore *pPropertyStore,
    v8::Local<v8::Value> &value, GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType)
{
    bool bRet = false;
    if ( value->IsString() == false)
    {
        printf("value is not IsString.\n");
        return false;
    }

    // To Local
    MaybeLocal<v8::String> strMaybeLocalStr = value->ToString(context);
    v8::Local<v8::String> localStringStr;
    if (strMaybeLocalStr.ToLocal(&localStringStr) == false)
    {
        printf("fail to ToLocal.\n");
        return false;
    }
    // To Primitive
    v8::String::Value unicodeValueStr(context->GetIsolate(), localStringStr);
    const uint16_t *primitiveStr = *unicodeValueStr;


    PROPVARIANT var;
    PropVariantInit(&var);
    if( emType == EM_DATA_TYPE_LPCWSTR )
    {
        var.vt = VT_LPWSTR;
        var.pwszVal = (wchar_t*)primitiveStr;
    }
    else
    if( emType == EM_DATA_TYPE_BSTR )
    {
        var.vt = VT_BSTR;
        var.bstrVal = ::SysAllocString( (wchar_t*)primitiveStr );
    }
    bRet = setpPropertyStoreValue(pPropertyStore, pGuid, dwPid, var);
    if( emType == EM_DATA_TYPE_BSTR )
    {
        ::SysFreeString(var.bstrVal);
    }
    return bRet;
}

// v8::Local<v8::Value>からVector|LPCWSTR型の値を取り出し、指定したプロパティー値にセットします。
bool getPropVectorLPWSTR(
    v8::Isolate* isolate,
    v8::Local<v8::Context> context,
    IPropertyStore *pPropertyStore,
    Local<Object> obj,
    const char* pKey,
    GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType)
{
    v8::Local<v8::String> propName;
    size_t msgSize = 0;

    msgSize = std::strlen(pKey);
    propName = v8::String::NewFromUtf8(isolate,  pKey , v8::NewStringType::kNormal, static_cast<int>(msgSize)).ToLocalChecked();

    PROPVARIANT var;
    if (getpPropertyStoreValue(pPropertyStore, pGuid, dwPid, var) == false)
    {
        ThrowTypeError(isolate, "fail to getpPropertyStoreValue.");
        return false;
    }
    if (var.vt == VT_EMPTY)
    {
        // dose not set property.
        obj->Set(context, propName, Undefined(isolate));
        return true;
    }



    if (var.vt == VT_LPWSTR)
    {
        HandleScope scope(isolate);
        Local<v8::String> result;
        MaybeLocal<v8::String> str = String::NewFromTwoByte(isolate, (const uint16_t *)var.pwszVal);
        str.ToLocal(&result);
        obj->Set(context, propName, result);
    }
    else
    if (IsPropVariantVector(var) != FALSE)
    {
        v8::Local<v8::Array> resultArray = v8::Array::New(isolate);
        DWORD dwCount = PropVariantGetElementCount(var);
        for (DWORD i = 0; i < dwCount; i++)
        {
            PWSTR pStr = NULL;
            HRESULT hr = PropVariantGetStringElem(var, i, &pStr);

            HandleScope scope(isolate);
            Local<v8::String> strL;
            MaybeLocal<v8::String> str = String::NewFromTwoByte(isolate, (const uint16_t *)pStr);
            str.ToLocal(&strL);

            resultArray->Set(context, i, strL);

            CoTaskMemFree(pStr);
        }


        obj->Set(context, propName, resultArray);
    } else
    {
        // dose not set property.
        obj->Set(context, propName, Undefined(isolate));
    }
    PropVariantClear(&var);
    return true;
}
bool setPropVectorLPWSTR(
    v8::Isolate* isolate,
    v8::Local<v8::Context> context,
    IPropertyStore *pPropertyStore,
    v8::Local<v8::Value> &value, GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType)
{
    bool bRet = false;

    bool bError = false;


    if (value->IsString())
    {
        return setPropLPWSTR(isolate, context, pPropertyStore, value, pGuid, dwPid, emType);
    }
    else if (value->IsArray())
    {
        std::vector<wchar_t *> cntValue;
        v8::Local<v8::Array> array = v8::Local<v8::Array>::Cast(value);

        uint32_t nArraySize = array->Length();

        for (uint32_t i = 0; i < nArraySize; i++)
        {
            v8::MaybeLocal<v8::Value> elementML = array->Get(context, i);
            v8::Local<v8::Value> localVal;
            if (elementML.ToLocal(&localVal) == false)
            {
                ThrowTypeError(isolate, "invalid type.");
                return false;
            }
            if (localVal->IsString() == true)
            {
                v8::Local<v8::String> localStringStr = v8::Local<v8::String>::Cast(localVal);
                v8::String::Value unicodeValueStr(context->GetIsolate(), localStringStr);
                const uint16_t *primitiveStr = *unicodeValueStr;
                const wchar_t *pStr = (const wchar_t *)primitiveStr;

                cntValue.push_back(wcsdup(pStr));
            }
        }
        size_t lengthStr = 0;
        std::vector<wchar_t *>::iterator ite;
        for (ite = cntValue.begin(); ite != cntValue.end(); ite++)
        {
            lengthStr += wcslen(*ite);
            lengthStr += 1;
        }
        lengthStr++;
        std::unique_ptr<wchar_t> apAlllocStrs(new wchar_t[lengthStr]);
        wchar_t *pWrk = apAlllocStrs.get();
        for (ite = cntValue.begin(); ite != cntValue.end(); ite++)
        {
            size_t len = wcslen(*ite);
            if (pWrk != apAlllocStrs.get())
            {
                wcscpy(pWrk, L";");
                pWrk++;
            }
            wcscpy(pWrk, *ite);
            pWrk += len;
            free(*ite);
        }
        cntValue.clear();


        PROPVARIANT var;
        HRESULT hr = InitPropVariantFromStringAsVector(apAlllocStrs.get(), &var);

        setpPropertyStoreValue(pPropertyStore, pGuid, dwPid, var);
        PropVariantClear(&var);
        return true;
    } else {
        return false;
    }
    return true;
}
//-------------------------------------------------------------------------------------------------------
// 特別名加工処理が必要な処理
// playTime
bool getPropPlayTime(
    v8::Isolate* isolate,
    v8::Local<v8::Context> context,
    IPropertyStore *pPropertyStore,
    Local<Object> obj,
    const char* pKey,
    GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType)
{
    v8::Local<v8::String> propName;
    size_t msgSize = 0;

    msgSize = std::strlen(pKey);
    propName = v8::String::NewFromUtf8(isolate,  pKey , v8::NewStringType::kNormal, static_cast<int>(msgSize)).ToLocalChecked();

    PROPVARIANT var;
    if (getpPropertyStoreValue(pPropertyStore, pGuid, dwPid, var) == false)
    {
        ThrowTypeError(isolate, "fail to getpPropertyStoreValue.");
        return false;
    }
    if (var.vt == VT_EMPTY)
    {
        // dose not set property.
        obj->Set(context, propName, Undefined(isolate));
        return true;
    }

    ULONGLONG ll100NanoSec = var.uhVal.QuadPart;
    PropVariantClear(&var);

    ULONGLONG llTimeTotalSec = ll100NanoSec / 10000000;
    ULONGLONG llTimeHour = llTimeTotalSec / (60 * 60);
    ULONGLONG llTimeMSec = (llTimeTotalSec - (llTimeHour * 60 * 60));
    llTimeMSec /= 60;
    ULONGLONG llTimeSec = llTimeTotalSec % 60;
    wchar_t wsz[256] = {0};

    wsprintfW(wsz, L"%d:%02d:%02d", (long)llTimeHour, (long)llTimeMSec, (long)llTimeSec);

    HandleScope scope(isolate);
    Local<v8::String> result;
    MaybeLocal<v8::String> str = String::NewFromTwoByte(isolate, (const uint16_t *)wsz);
    str.ToLocal(&result);

    obj->Set(context, propName, result);
    PropVariantClear(&var);
    return true;
}

//-------------------------------------------------------------------------------------------------------
// 関数のプロトタイプの宣言
typedef bool (*FuncPtrGetProp)( \
    v8::Isolate* isolate,\
    v8::Local<v8::Context> context,\
    IPropertyStore *pPropertyStore,\
    Local<Object> obj,\
    const char* pKey,\
    GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType);
typedef bool (*FuncPtrSetProp)( \
    v8::Isolate* isolate, \
    v8::Local<v8::Context> context, \
    IPropertyStore *pPropertyStore, \
    v8::Local<v8::Value> &value, GUID *pGuid, DWORD dwPid, EM_DATA_TYPE emType);


#if 0
//-------------------------------------------------------------------------------------------------------
// ファイル属性名情報
struct tagFileAttr
{
    char*   pAttrName;   ///<   属性名
    DWORD   dwMask;
} g_FileAttr [] = {
    { "ReadOnly", FILE_ATTRIBUTE_READONLY }
  , { "Hidden",   FILE_ATTRIBUTE_HIDDEN }
  , { "System",   FILE_ATTRIBUTE_SYSTEM }
  , { "Archive",  FILE_ATTRIBUTE_ARCHIVE }
  , { NULL, 0 }
};


void getFileAttr(const FunctionCallbackInfo<Value> &args)
{
    bool bError = false;
    DWORD dwAttr = 0;
    v8::Isolate* isolate = args.GetIsolate();
    v8::Local<v8::Context> context = v8::Context::New(v8::Isolate::GetCurrent());

    std::unique_ptr<wchar_t> upFilePath;
    upFilePath = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 0, args, bError));
    if (upFilePath.get() == NULL)
    {
        return ;
    }
    if (bError == true)
    {
        return ;
    }

    //　ファイルの属性情報を取得
    dwAttr = GetFileAttributesW(upFilePath.get());
    if( dwAttr == INVALID_FILE_ATTRIBUTES )
    {
        return ;
    }


    // 新しいオブジェクトを作成
    Local<Object> obj = Object::New(isolate);
    for(int i = 0; ; i++)
    {
        if( g_FileAttr[i].pAttrName == NULL )
        {
            break;
        }
        v8::Local<v8::String> propName;
        size_t msgSize = 0;

        msgSize = std::strlen(g_FileAttr[i].pAttrName);
        propName = v8::String::NewFromUtf8(isolate,  g_FileAttr[i].pAttrName , v8::NewStringType::kNormal, static_cast<int>(msgSize)).ToLocalChecked();

        obj->Set(context, propName, true);
    }
    // オブジェクトをJavaScriptに返す
    args.GetReturnValue().Set(obj);
}
#endif

//-------------------------------------------------------------------------------------------------------
// プロパティー一覧情報を定義
struct tagProTag
{
    char*   pTagName;   ///<   タグ名
    GUID*   pGuid;      ///<    プロパティGUID
    DWORD   dwPid;      ///<    プロパティPID
    EM_DATA_TYPE     emType;    ///< データタイプ
    FuncPtrGetProp  pGetFunc;    ///< ゲッター関数
    FuncPtrSetProp  pSetFunc;    ///< セッター関数
    bool    bReadOnry;    ///< 読み込み専用？
} g_ProTag [] = {
        {"year",    &g__MUSIC, PIDSI_YEAR, EM_DATA_TYPE_U4, getPropUint4, setPropUint4, false}
    ,   {"artists", &g__MUSIC, PIDSI_ARTIST, EM_DATA_TYPE_VECTOR_LPCWSTR, getPropVectorLPWSTR, setPropVectorLPWSTR, false}
    ,   {"tags",    &g__SUMMARYINFORMATION, 5, EM_DATA_TYPE_VECTOR_LPCWSTR, getPropVectorLPWSTR, setPropVectorLPWSTR, false}
    ,   {"genre",    &g__MUSIC, PIDSI_GENRE, EM_DATA_TYPE_VECTOR_LPCWSTR, getPropVectorLPWSTR, false}
    ,   {"title",   &g__SUMMARYINFORMATION, 0x00000002, EM_DATA_TYPE_LPCWSTR, getPropLPWSTR, setPropLPWSTR, false}
    ,   {"subTitle", &g__MUSIC, 38, EM_DATA_TYPE_LPCWSTR, getPropLPWSTR, setPropLPWSTR, false}

    ,   {"track",    &g__MUSIC, PIDSI_TRACK, EM_DATA_TYPE_U4, getPropUint4, setPropUint4, false}
    ,   {"albumArtist",   &g__MUSIC, 13, EM_DATA_TYPE_LPCWSTR, getPropLPWSTR, setPropLPWSTR, false}




    ,   {"comment", &g__SUMMARYINFORMATION, 6, EM_DATA_TYPE_LPCWSTR, getPropLPWSTR, setPropLPWSTR, false}
    ,   {"evaluation",    &g__MEDIAFILESUMMARYINFORMATION, 9, EM_DATA_TYPE_U4, getPropUint4, setPropUint4, false}


    // ReadOnly
    ,   {"frameRate",    &g__VIDEO, PIDVSI_FRAME_RATE, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"frameWidth",   &g__VIDEO, PIDVSI_FRAME_WIDTH, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"frameHeight",  &g__VIDEO, PIDVSI_FRAME_HEIGHT, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"playTime",    &g__AUDIO, 3, EM_DATA_TYPE_LPCWSTR, getPropPlayTime, NULL, true}

    ,   {"dataRate",  &g__AUDIO, PIDASI_AVG_DATA_RATE, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"sampleRate",  &g__AUDIO, PIDASI_SAMPLE_RATE, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"sampleSize",  &g__AUDIO, PIDASI_SAMPLE_SIZE, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"channelCount",  &g__AUDIO, PIDASI_CHANNEL_COUNT, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"streamNumber",  &g__AUDIO, PIDASI_STREAM_NUMBER, EM_DATA_TYPE_U2, getPropUint4, NULL, true}
    ,   {"streamName", &g__AUDIO, PIDASI_STREAM_NAME, EM_DATA_TYPE_LPCWSTR, getPropLPWSTR, setPropLPWSTR, true}
    ,   {"compression", &g__AUDIO, PIDASI_COMPRESSION, EM_DATA_TYPE_LPCWSTR, getPropLPWSTR, setPropLPWSTR, true}

    ,   {"contentType", &g_PSGUID_DOCUMENTSUMMARYINFORMATION, 26, EM_DATA_TYPE_LPCWSTR, getPropLPWSTR, setPropLPWSTR, true}

    // IMAGE Summary
    ,   {"imgCx", &g_PSGUID_IMAGESUMMARYINFORMATION, 3, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"imgCy", &g_PSGUID_IMAGESUMMARYINFORMATION, 4, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"imgBitDepth", &g_PSGUID_IMAGESUMMARYINFORMATION, 7, EM_DATA_TYPE_U4, getPropUint4, NULL, true}
    ,   {"imgResolutionX", &g_PSGUID_IMAGESUMMARYINFORMATION, 5, EM_DATA_TYPE_R8, getPropReal8, NULL, true}
    ,   {"imgResolutionY", &g_PSGUID_IMAGESUMMARYINFORMATION, 6, EM_DATA_TYPE_R8, getPropReal8, NULL, true}

    ,   {NULL, NULL, 0, EM_DATA_TYPE_U4, false}
};

void getProps(const FunctionCallbackInfo<Value> &args)
{
    bool bError = false;
    v8::Isolate* isolate = args.GetIsolate();
    v8::Local<v8::Context> context = v8::Context::New(v8::Isolate::GetCurrent());


    IPropertyStore* pPropertyStore = NULL;
    std::unique_ptr<wchar_t> upFilePath;
    upFilePath = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 0, args, bError));
    if (upFilePath.get() == NULL)
    {
        return ;
    }
    if (bError == true)
    {
        return ;
    }

    pPropertyStore = getPropertyStore(upFilePath.get(), true);
    if (pPropertyStore == NULL)
    {
        ThrowTypeError(isolate, "fail to getPropertyStore.");
        return ;
    }



    // 新しいオブジェクトを作成
    Local<Object> obj = Object::New(isolate);
    for(int i = 0; ; i++)
    {
        if( g_ProTag[i].pTagName == NULL )
        {
            break;
        }

        g_ProTag[i].pGetFunc(isolate, context, (IPropertyStore*)pPropertyStore, obj, g_ProTag[i].pTagName, g_ProTag[i].pGuid, g_ProTag[i].dwPid, g_ProTag[i].emType);
    }
    pPropertyStore->Release();


    // オブジェクトをJavaScriptに返す
    args.GetReturnValue().Set(obj);
}

void setProps(const FunctionCallbackInfo<Value> &args)
{
    bool bRet = false;
    v8::Isolate* isolate = args.GetIsolate();
    v8::Local<v8::Context> context = v8::Context::New(v8::Isolate::GetCurrent());


    IPropertyStore* pPropertyStore = NULL;
    bool bError = false;
    std::unique_ptr<wchar_t> upFilePath;

    upFilePath = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 0, args, bError));
    if (upFilePath.get() == NULL)
    {
        return ;
    }
    if (bError == true)
    {
        return ;
    }

    if (args.Length() != 2 || !args[1]->IsObject()) {
        ThrowTypeError(isolate, "dose not object.");
        return;
    }
    v8::Local<v8::Object> obj = args[1].As<v8::Object>();


    pPropertyStore = getPropertyStore(upFilePath.get(), false);
    if (pPropertyStore == NULL)
    {
        ThrowTypeError(isolate, "fail to getPropertyStore.");
        return ;
    }


    v8::Local<v8::String> propName;
    size_t msgSize = 0;
    // プロパティ名を指定して値を取得
    for(int i = 0; ; i++)
    {
        if( g_ProTag[i].pTagName == NULL )
        {
            break;
        }
        if( g_ProTag[i].bReadOnry == true || g_ProTag[i].pSetFunc == NULL )
        {
            continue;
        }
        msgSize = std::strlen( g_ProTag[i].pTagName );
        propName = v8::String::NewFromUtf8(isolate,  g_ProTag[i].pTagName , v8::NewStringType::kNormal, static_cast<int>(msgSize)).ToLocalChecked();
        if (obj->HasOwnProperty(isolate->GetCurrentContext(),propName).ToChecked())
        {
            v8::Local<v8::Value> value;

            value = obj->Get(isolate->GetCurrentContext(), propName).ToLocalChecked();
            bool bRet = false;

           bRet = g_ProTag[i].pSetFunc(isolate, context, (IPropertyStore*)pPropertyStore, value, g_ProTag[i].pGuid, g_ProTag[i].dwPid, g_ProTag[i].emType );
            if( bRet == false )
            {
                char szErrMsg[256] = {0};
                sprintf(szErrMsg, "invalid data type. on property name:%s", g_ProTag[i].pTagName );
                ThrowTypeError(isolate, szErrMsg);
                pPropertyStore->Release();
                return;
            }

        }
    }

	try {
        bRet = setpPropertyStoreCommit((IPropertyStore*)pPropertyStore);
    }
    catch( _com_error& e)
    {
        ThrowTypeError(isolate, "Commit Error.");
    }

    pPropertyStore->Release();
    args.GetReturnValue().Set(bRet);
}


void dumpPropertyStore(const FunctionCallbackInfo<Value> &args);


void init(Local<Object> exports)
{
    // COM initialization
    CoInitialize(NULL);

    NODE_SET_METHOD(exports, "getAbsoltePath", getAbsoltePath);
    NODE_SET_METHOD(exports, "setAbsoltePath", setAbsoltePath);
    NODE_SET_METHOD(exports, "openShellProperty", openShellProperty);
    NODE_SET_METHOD(exports, "openShellOpen",   openShellOpen);

    NODE_SET_METHOD(exports, "dumpPropertyStore", dumpPropertyStore);


    NODE_SET_METHOD(exports, "getProps", getProps);
    NODE_SET_METHOD(exports, "setProps", setProps);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)





//------------------------------------------------------------------
// 開発用に、セットされてプロパティ情報を表示する関数
void dumpPropertyStore(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();
    v8::Local<v8::Context> context = v8::Context::New(v8::Isolate::GetCurrent());
    HRESULT hr = S_OK;
    bool bError = false;
    std::unique_ptr<wchar_t> upFilePath;

    // get arg[0]
    upFilePath = std::unique_ptr<wchar_t>(getArgvString(isolate, context, 0, args, bError));
    if (upFilePath.get() == NULL)
    {
        return;
    }
    if (bError == true)
    {
        return;
    }

    IPropertyStore *pPropStore(getPropertyStore(upFilePath.get(), true));
    if (pPropStore == NULL)
    {
        return;
    }

    DWORD dwProps = 0;
    pPropStore->GetCount(&dwProps);
    for (DWORD dwI = 0; dwI < dwProps; dwI++)
    {
        PROPERTYKEY pkey;
        hr = pPropStore->GetAt(dwI, &pkey);
        if (!SUCCEEDED(hr))
        {
            continue;
        }

        if (::memcmp(&(pkey.fmtid), &g__MUSIC, sizeof(pkey.fmtid)) == 0)
        {
            printf("MUSIC.");
            switch (pkey.pid)
            {
            case 2:
                printf("PIDSI_ARTIST");
                break;
            case 4:
                printf("PIDSI_ALBUM");
                break;
            case 5:
                printf("PIDSI_YEAR");
                break;
            case 6:
                printf("PIDSI_COMMENT");
                break;
            case 7:
                printf("PIDSI_TRACK");
                break;
            case 11:
                printf("PIDSI_GENRE");
                break;
            case 12:
                printf("PIDSI_LYRICS");
                break;
            default:
                printf("???? UnkownPID:%d", pkey.pid);
                break;
            }
            printf("\n");
        }
        else if (::memcmp(&(pkey.fmtid), &g__AUDIO, sizeof(pkey.fmtid)) == 0)
        {
            printf("AUDIO.");
            switch (pkey.pid)
            {
            case 0x00000002:
                printf("PIDASI_FORMAT");
                break;
            case 0x00000003:
                printf("PIDASI_TIMELENGTH");
                break;
            case 0x00000004:
                printf("PIDASI_AVG_DATA_RATE");
                break;
            case 0x00000005:
                printf("PIDASI_SAMPLE_RATE");
                break;
            case 0x00000006:
                printf("PIDASI_SAMPLE_SIZE");
                break;
            case 0x00000007:
                printf("PIDASI_CHANNEL_COUNT");
                break;
            default:
                printf("???? UnkownPID:%d", pkey.pid);
                break;
            }

            printf("\n");
        }
        else if (::memcmp(&(pkey.fmtid), &g__VIDEO, sizeof(pkey.fmtid)) == 0)
        {
            printf("VIDEO.");
            switch (pkey.pid)
            {
            case 0x00000002: // PIDVSI_STREAM_NAME
                printf("PIDVSI_STREAM_NAME");
                break;
            case 0x00000003:
                printf("PIDVSI_FRAME_WIDTH");
                break;
            case 0x00000004:
                printf("PIDVSI_FRAME_HEIGHT");
                break;
            case 0x00000007:
                printf("PIDVSI_TIMELENGTH");
                break;
            case 0x00000005:
                printf("PIDVSI_FRAME_COUNT");
                break;
            case 0x00000006:
                printf("PIDVSI_FRAME_RATE");
                break;
            case 0x00000008:
                printf("PIDVSI_DATA_RATE");
                break;
            case 0x00000009:
                printf("PIDVSI_SAMPLE_SIZE");
                break;
            case 0x0000000A:
                printf("PIDVSI_COMPRESSION");
                break;
            default:
                printf("???? UnkownPID:%d", pkey.pid);
                break;
            }
            printf("\n");
        }
        else if (::memcmp(&(pkey.fmtid), &g__MEDIAFILESUMMARYINFORMATION, sizeof(pkey.fmtid)) == 0)
        {
            printf("MEDIAFILESUMMARYINFORMATION.");
            switch (pkey.pid)
            {
            case 0x00000009: // PIDVSI_STREAM_NAME
                printf("evaluation");
                break;
            default:
                printf("???? UnkownPID:%d", pkey.pid);
                break;
            }
            printf("\n");
        }
        else if (::memcmp(&(pkey.fmtid), &g__SUMMARYINFORMATION, sizeof(pkey.fmtid)) == 0)
        {
            printf("SUMMARYINFORMATION.");
            switch (pkey.pid)
            {
            case 0x00000002:
                printf("Title");
                break;
            case 0x00000006:
                printf("Comment");
                break;
            default:
                printf("???? UnkownPID:%d", pkey.pid);
                break;
            }
            printf("\n");
        }
        else if (::memcmp(&(pkey.fmtid), &g_FMTID_Storage, sizeof(pkey.fmtid)) == 0)
        {
            printf("FMTID_Storage.");
            printf("???? UnkownPID:%d", pkey.pid);
            printf("\n");
        }
        else if (::memcmp(&(pkey.fmtid), &g_PSGUID_DOCUMENTSUMMARYINFORMATION, sizeof(pkey.fmtid)) == 0)
        {
            printf("DocSummaryInformation.");
            printf("???? UnkownPID:%d", pkey.pid);
            printf("\n");
        }
        else if (::memcmp(&(pkey.fmtid), &g_PSGUID_MISC, sizeof(pkey.fmtid)) == 0)
        {
            printf("Misc.");
            printf("???? UnkownPID:%d", pkey.pid);
            printf("\n");
        }
// g_PSGUID_SHELLDETAILS
        else if (::memcmp(&(pkey.fmtid), &g_PSGUID_SHELLDETAILS, sizeof(pkey.fmtid)) == 0)
        {
            printf("Shell Details.");
            printf("???? UnkownPID:%d", pkey.pid);
            printf("\n");
        }
        else if (::memcmp(&(pkey.fmtid), &g_PSGUID_IMAGESUMMARYINFORMATION, sizeof(pkey.fmtid)) == 0)
        {
            printf("IMAGE Summary.");

            //PIDISI_FILETYPE
            switch (pkey.pid)
            {
            case 2:
                printf("FILETYPE");
                break;
            case 3:
                printf("CX");
                break;
            case 4:
                printf("CY");
                break;
            case 5:
                printf("ResolutionX");
                break;
            case 6:
                printf("ResolutionY");
                break;
            case 7:
                printf("BitDepth");
                break;
            case 8:
                printf("COLORSPACE");
                break;
            case 9:
                printf("COMPRESSION");
                break;
            case 0xA:
                printf("TRANSPARENCY");
                break;
            case 0xB:
                printf("GAMMAVALUE");
                break;
            case 0xC:
                printf("FRAMECOUNT");
                break;
            case 0xD:
                printf("DIMENSIONS");
                break;



            default:
                printf("???? UnkownPID:%d", pkey.pid);
                break;
            }
            printf("\n");
        }
        //

        else
        {
            printf("{%08X-%04X-%04X-%02X%02X-%02X%02X%02X%02X%02X%02X}, pid=%d\n",
                   pkey.fmtid.Data1,
                   pkey.fmtid.Data2,
                   pkey.fmtid.Data3,
                   pkey.fmtid.Data4[0],
                   pkey.fmtid.Data4[1],
                   pkey.fmtid.Data4[2],
                   pkey.fmtid.Data4[3],
                   pkey.fmtid.Data4[4],
                   pkey.fmtid.Data4[5],
                   pkey.fmtid.Data4[6],
                   pkey.fmtid.Data4[7],
                   pkey.pid);
        }

        printf("   ");
        PROPVARIANT var;
        pPropStore->GetValue(pkey, &var);
        switch (var.vt)
        {
        case VT_I2:
            printf("VT_I2:");
            printf("%d", var.iVal);
            break;
        case VT_I4:
            printf("VT_I4:");
            printf("%d", var.lVal);
            break;
        case VT_R4:
            printf("VT_R4:");
            printf("%f", var.fltVal);
            break;
        case VT_R8:
            printf("VT_R8:");
            printf("%f", var.dblVal);
            break;
        case VT_CY:
            printf("VT_CY:");
            break;
        case VT_DATE:
            printf("VT_DATE:");
            break;
        case VT_BSTR:
            printf("VT_BSTR:%S", var.bstrVal);
            break;
        case VT_DISPATCH:
            printf("VT_DISPATCH:");
            break;
        case VT_ERROR:
            printf("VT_ERROR:");
            break;
        case VT_BOOL:
            printf("VT_BOOL:");
            break;
        case VT_VARIANT:
            printf("VT_VARIANT:");
            break;
        case VT_UNKNOWN:
            printf("VT_UNKNOWN:");
            break;
        case VT_DECIMAL:
            printf("VT_DECIMAL:");
            break;
        case VT_RECORD:
            printf("VT_RECORD:");
            break;
        case VT_I1:
            printf("VT_I1:");
            printf("%d", var.cVal);
            break;
        case VT_UI1:
            printf("VT_UI1:");
            printf("%d", var.bVal);
            break;
        case VT_UI2:
            printf("VT_UI2:");
            printf("%d", var.uiVal);
            break;
        case VT_UI4:
            printf("VT_UI4:");
            printf("%d", var.ulVal);
            break;
        case VT_I8:
            printf("VT_I8:");
            break;
        case VT_UI8:
            printf("VT_UI8:");
            break;
        case VT_INT:
            printf("VT_INT:");
            printf("%d", var.ulVal);
            break;
        case VT_UINT:
            printf("VT_UINT:");
            printf("%d", var.ulVal);
            break;
        case VT_LPSTR:
            printf("VT_LPSTR:%s", var.pszVal);
            break;
        case VT_LPWSTR:
            printf("VT_LPWSTR:%S", var.pwszVal);
            break;
        case VT_FILETIME:
            printf("VT_FILETIME:");
            break;
        default:
            if (IsPropVariantVector(var) != FALSE)
            {
                // Vector:(0x101F)
                // VT_VECTOR	= 0x1000,

                unsigned long ul = var.vt & ~VT_VECTOR;
                printf("Vector:(0x%X/%X)", var.vt, ul);
                if( ul == VT_LPWSTR )
                {
                    v8::Local<v8::Array> resultArray = v8::Array::New(isolate);
                    DWORD dwCount = PropVariantGetElementCount(var);
                    for (DWORD i = 0; i < dwCount; i++)
                    {
                        PWSTR pStr = NULL;
                        HRESULT hr = PropVariantGetStringElem(var, i, &pStr);

                        printf("\n");
                        printf("  * %S", pStr);

                        CoTaskMemFree(pStr);
                    }

                }


            } else {
                printf("????(0x%X)", var.vt);
            }
            break;
        }
        printf("\n");

        PropVariantClear(&var);
    }
    pPropStore->Release();

    args.GetReturnValue().Set(Undefined(isolate));
}
