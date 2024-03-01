
#include <comdef.h>
#include "property_store.h"
#include <shobjidl_core.h>

IPropertyStore* getPropertyStore(const WCHAR *sURL, bool bReadOnlry)
{
	IPropertyStore* pPropertyStore = NULL;
	GETPROPERTYSTOREFLAGS emFlag = bReadOnlry ? GPS_DEFAULT : GPS_READWRITE ;
	HRESULT hr = SHGetPropertyStoreFromParsingName(
		sURL,
		NULL,
		emFlag, //
		__uuidof(IPropertyStore),
		(void**)&pPropertyStore);

	if (!SUCCEEDED(hr))
	{
		return NULL;
	}
	return pPropertyStore;
}


bool getpPropertyStoreValue(IPropertyStore* pPropertyStore, GUID* pGuid, DWORD dwPid, PROPVARIANT &var)
{
	PROPERTYKEY pkey;
	HRESULT hr = S_OK;
	
	::memcpy(&(pkey.fmtid), pGuid, sizeof(pkey.fmtid));
	pkey.pid = dwPid;

	
	hr = pPropertyStore->GetValue(pkey, &var);
	if (!SUCCEEDED(hr))
	{
		try {
			_com_raise_error(hr, NULL);
		} 
		catch( _com_error& e)
		{
			printf("IPropertyStore::GetValue Error:%s\n", (LPCTSTR)e.Description());
			printf("   %s\n", e.ErrorMessage());
		}
		return false;
	}


	return true;
}
bool setpPropertyStoreValue(IPropertyStore* pPropertyStore, GUID* pGuid, DWORD dwPid, PROPVARIANT &var)
{
	PROPERTYKEY pkey;
	HRESULT hr = S_OK;
	
	::memcpy(&(pkey.fmtid), pGuid, sizeof(pkey.fmtid));
	pkey.pid = dwPid;

	
	hr = pPropertyStore->SetValue(pkey, var);
	if (!SUCCEEDED(hr))
	{

		try {
			_com_raise_error(hr, NULL);
		} 
		catch( _com_error& e)
		{
			printf("IPropertyStore::SetValue Error:%s\n", (LPCTSTR)e.Description());
			printf("   %s\n", e.ErrorMessage());
		}
		return false;
	}


	return true;
}

bool setpPropertyStoreCommit(IPropertyStore* pPropertyStore)
{	
	HRESULT hr = S_OK;
	hr =pPropertyStore->Commit();
	if (!SUCCEEDED(hr))
	{
		try {
			_com_raise_error(hr, NULL);
		} 
		catch( _com_error& e)
		{
			printf("IPropertyStore::Commit Error:%s\n", (LPCTSTR)e.Description());
			printf("   %s\n", e.ErrorMessage());
			throw e;
		}
		return false;
	}
	return true;
}
