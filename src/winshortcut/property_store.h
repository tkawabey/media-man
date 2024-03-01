#ifndef __PROPERTY_STORE_H__
#define __PROPERTY_STORE_H__

#include <windows.h>
#include <propsys.h>


IPropertyStore* getPropertyStore(const WCHAR *sURL, bool bReadOnlry);
bool getpPropertyStoreValue(IPropertyStore* pPropertyStore, GUID* pGuid, DWORD dwPid, PROPVARIANT &var);
bool setpPropertyStoreValue(IPropertyStore* pPropertyStore, GUID* pGuid, DWORD dwPid, PROPVARIANT &var);
bool setpPropertyStoreCommit(IPropertyStore* pPropertyStore);


#endif /*__PROPERTY_STORE_H__*/
