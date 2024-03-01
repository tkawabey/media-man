// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */

/*
  参考
  https://qiita.com/udayaan/items/2a7c8fd0771d4d995b69

*/

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// export type Channels = 'ipc-media-man';
export type Channels = string;
export type ChannelImportGrps = 'ipc-import-grp';
export type ChannelSendmsgGroup = 'ipc-sendmsg-grp';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },

  //
  anyFunc:{},

  // ファイルのプロパティを表示する。
  doOpenProperty: async (path: string): Promise<any> => {
    return await ipcRenderer.invoke('ipc-open-property', path);
  },
  // 外部プログラムで、ファイルを開く
  doOpenExternalPrg: async (path: string) => {
    return await ipcRenderer.invoke('ipc-open-external-prg', path);
  },
  // パスが存在するかチェックします。
  isExistPath: (path: string) => {
    return ipcRenderer.invoke('ipc-exit-path', path);
  },
  /*
  // フォルダーの選択
  doSelectFolder: async  () => {
    return await ipcRenderer.invoke('ipc-select-folder');
  },
*/
  doListFilesRecursively: async () => {
    ipcRenderer.invoke('ipc-listFilesRecursively');
  },

  ///-------------------------------------------
  // 拡張コマンド
  ///-------------------------------------------
  // 拡張コマンドのメニューを返す
  doGetExtendCommandMenuGroup: async(kind:number, subKind:number) => {
    return ipcRenderer.invoke('ipc-extend-command-menu-gpoup', [kind, subKind]);
  },

  ///-------------------------------------------
  // APP-コンフィグ
  ///-------------------------------------------
  // app.configのkinds一覧を取得
  doGetAppConfigKinds: async () => {
    return await ipcRenderer.invoke('ipc-get-app-config-kinds');
  },
  // app.configのsub-kinds一覧を取得
  doGetAppConfigSubKinds: async () => {
    return await ipcRenderer.invoke('ipc-get-app-config-sub-kinds');
  },

  ///-------------------------------------------
  // コンフィグ
  ///-------------------------------------------
  // 設定情報の取得。
  doGetConfigValue: async (key: string) => {
    return await ipcRenderer.invoke('ipc-get-config', key);
  },
  // 設定情報の取得。
  doSetConfigValue: async (key: string, value: string) => {
    return await ipcRenderer.invoke('ipc-set-config', key, value);
  },
  // 絞り込み情報を取得
  doGetCookieQueryData: async (UID:number, GID:number) => {
    return await ipcRenderer.invoke('ipc-get-query-data', UID, GID);
  },
  // 絞り込み情報を設定
  doSetCookieQueryData: async (UID:number, GID:number, Favorite:number|undefined, QueryTitle:string|undefined ) => {
    return await ipcRenderer.invoke('ipc-set-query-data', UID, GID, Favorite, QueryTitle );
  },

  ///-------------------------------------------
  // インポートEx
  ///-------------------------------------------
  doImportEx: async (currentGID:number) => {
    return await ipcRenderer.invoke('ipc-import-ex', currentGID);
  },

  ///-------------------------------------------
  // パンくず
  ///-------------------------------------------
  // 設定情報の取得。
  doGetBreadcrumb: async (strClass: string, strID: string) => {
    return await ipcRenderer.invoke('ipc-breadcrumb', strClass, strID);
  },


  ///-------------------------------------------
  // グループ
  ///-------------------------------------------
  doLoadGroups: async (PARENT_GID: number) => {
    return await ipcRenderer.invoke('ipc-load-groups', PARENT_GID);
  },
  doLoadGroupsSimple: async (PARENT_GID: number) => {
    return await ipcRenderer.invoke('ipc-load-groups-simple', PARENT_GID);
  },
  doGetGroup: async (GID: number) => {
    return await ipcRenderer.invoke('ipc-get-group', GID);
  },
  updGroupFavorite: async (GID: number, iFav: number) => {
    return await ipcRenderer.invoke('ipc-upd-group-favorite', GID, iFav);
  },
  updGroup: async (GID: number, updObj: any, objConfigJson: any) => {
    return await ipcRenderer.invoke('ipc-upd-group', GID, updObj, objConfigJson);
  },
  updGRelation: async (GID: number, gids: number[]) => {
    return await ipcRenderer.invoke('ipc-upd-grelation', GID, gids);
  },
  canAddGroup: async (dir: string, newName: string) => {
    return await ipcRenderer.invoke('ipc-can-add-group', dir, newName);
  },
  addGroup: async (GID: number, dir: string[], newName: string) => {
    return await ipcRenderer.invoke('ipc-add-group', GID, dir, newName);
  },
  getGroupSaveSID: async (GID: number) => {
    return await ipcRenderer.invoke('ipc-get-group-save-sid', GID);
  },
  changeGroupSaveSID: async (GID: number, SID:string) => {
    return await ipcRenderer.invoke('ipc-change-group-save-sid', GID, SID);
  },



  ///-------------------------------------------
  // アイテム
  ///-------------------------------------------
  // IDを指定して、アイテムの詳細を取得
  doGetItem: async (IID: number) => {
    return await ipcRenderer.invoke('ipc-get-item', IID);
  },
  doUpdItemAtCurrentTime: async (IID: number, CurrentTime: number) => {
    return await ipcRenderer.invoke(
      'ipc-upd-item-current-time',
      IID,
      CurrentTime,
    );
  },
  updItemFavorite: async (IID: number, iFav: number) => {
    return await ipcRenderer.invoke('ipc-upd-item-favorite', IID, iFav);
  },
  incrementPlatCount: async (IID: number) => {
    return await ipcRenderer.invoke('ipc-inc-item-playcount', IID);
  },
  doReImportItem: async (IID: number) => {
    return await ipcRenderer.invoke('ipc-item-reimport', IID);
  },
  doMakeItemThumbnail: async (IID: number) => {
    return await ipcRenderer.invoke('ipc-item-make-thumbnail', IID);
  },
  updItem: async (IID: number, updObj: any) => {
    return await ipcRenderer.invoke('ipc-upd-item', IID, updObj);
  },
  delItem: async (IID: number) => {
    return await ipcRenderer.invoke('ipc-del-item', IID);
  },
  getLinkedItems: async (IID: number) => {
    return await ipcRenderer.invoke('ipc-get-linked-items', IID);
  },

  ///-------------------------------------------
  // ストレージ
  ///-------------------------------------------
  doLoadStrages: async () => {
    return await ipcRenderer.invoke('ipc-load-strages');
  },
  doAddStrages: async (SID: string, Path: string) => {
    return await ipcRenderer.invoke('ipc-add-strages', SID, Path);
  },
  doDelStrages: async (SID: string) => {
    return await ipcRenderer.invoke('ipc-del-strages', SID);
  },


  ///-------------------------------------------
  // ジャンル
  ///-------------------------------------------
  doLoadGenres: async () => {
    return await ipcRenderer.invoke('ipc-load-genres');
  },
  doGetGenreName: async (GENRE_ID: number) => {
    return await ipcRenderer.invoke('ipc-get-genre-name', GENRE_ID);
  },
  doGetItemsWhereGenre: async (
    GENRE_ID: number,
    iPageLimit: number,
    iPageOffset: number,
  ) => {
    return await ipcRenderer.invoke(
      'ipc-get-items-where-genre',
      GENRE_ID,
      iPageLimit,
      iPageOffset,
    );
  },
  doGetItemCountWhereGenreID: async (GENRE_ID: number) => {
    return await ipcRenderer.invoke(
      'ipc-get-count-of-items-where-genreid',
      GENRE_ID,
    );
  },

  ///-------------------------------------------
  // タグ
  ///-------------------------------------------
  doLoadTags: async () => {
    return await ipcRenderer.invoke('ipc-load-tags');
  },
  doGetTagName: async (TAG_ID: number) => {
    return await ipcRenderer.invoke('ipc-get-tag-name', TAG_ID);
  },
  doGetItemsWhereTag: async (
    TAG_ID: number,
    iPageLimit: number,
    iPageOffset: number,
  ) => {
    return await ipcRenderer.invoke(
      'ipc-get-items-where-tag',
      TAG_ID,
      iPageLimit,
      iPageOffset,
    );
  },
  doGetItemCountWhereTagID: async (TAG_ID: number) => {
    return await ipcRenderer.invoke(
      'ipc-get-count-of-items-where-tagid',
      TAG_ID,
    );
  },


  ///-------------------------------------------
  // フリーワード検索
  ///-------------------------------------------
  doCountSearchFreeWoard: async (word: string) => {
    return await ipcRenderer.invoke(
      'ipc-get-count-of-search-free-word',
      word,
    );
  },
  doSearchFreeWoard: async (
    word: string,
    iPageLimit: number,
    iPageOffset: number,
  ) => {
    return await ipcRenderer.invoke(
      'ipc-search-free-word',
      word,
      iPageLimit,
      iPageOffset,
    );
  },


};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
