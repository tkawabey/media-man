/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
const { execSync, exec   } = require('child_process')
import ConfigAcc from "./config-acc";
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {ImpleFile, ImpleGroup, BreadcrumbData, GRP_INTEGRQTE} from './class-def';
import {SqlImpl, importDataInDb, importDataInDbAtGroup, getBreadcrumbData, makeThumbnailRecur, testSqlImp, resolveLinkAtGroup, CK_QUERY_DATA } from './sql-impl';
import {
    loadConfigJson
  , listGroupAndFilesRecursively
  , listGroupAndFilesRecursivelySpGroup
  , getID3TagFromMP3File
  , getExifFromImgeFile
  , makeThumbnail,
  hasValue,
  updateCheckAtGroup,
  getGroupRecurOpt,
  updateItemMetaData,
  updJsonConfig,
  listupChildFiles,
  isExistStringList,
  addGroup,
  importEx,
  fileDupCheck,
  delItemReal,
  getJsonConfigFileStrageID,
  changeJsonConfigFileStrageID,
  metadetaImportItem
 } from './commonfunc';
import { ids } from 'webpack';


 process.on('uncaughtException', (err) => {
  log.error(err); // ログファイルへ記録
  app.quit();     // アプリを終了する (継続しない方が良い)
});

const winshortcut = require('winshortcut');


class AppUpdater {
  constructor() {
    log.transports.file.level = 'debug';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}
let mainWindow: BrowserWindow | null = null;
// eslint-disable-next-line camelcase


// 拡張コマンド
let gExtCmdConf:any;
let gLoadedExtCmdScript:any;


// Set level
console.log("log.transports.file.level", log.transports.file.level);
console.log("log.transports.console.level", log.transports.console.level);
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';


/*
console.log(`app.getAppPath() = ${app.getAppPath()}`);

console.log('\n==== Application data');
console.log(`app.getPath('home')       = ${app.getPath('home')}`);
console.log(`app.getPath('temp')       = ${app.getPath('temp')}`);
console.log(`app.getPath('appData')    = ${app.getPath('appData')}`);
console.log(`app.getPath('cache')      = ${app.getPath('cache')}`);
console.log(`app.getPath('userData')   = ${app.getPath('userData')}`);
console.log(`app.getPath('logs')       = ${app.getPath('logs')}`);
console.log(`app.getPath('crashDumps') = ${app.getPath('crashDumps')}`);

console.log('\n==== OS multimedia')
console.log(`app.getPath('desktop')    = ${app.getPath('desktop')}`);
console.log(`app.getPath('documents')  = ${app.getPath('documents')}`);
console.log(`app.getPath('downloads')  = ${app.getPath('downloads')}`);
console.log(`app.getPath('music')      = ${app.getPath('music')}`);
console.log(`app.getPath('pictures')   = ${app.getPath('pictures')}`);
console.log(`app.getPath('videos')     = ${app.getPath('videos')}`);

console.log('\n==== Executables')
console.log(`app.getPath('exe')        = ${app.getPath('exe')}`);
console.log(`app.getPath('module')     = ${app.getPath('module')}`);
*/
ipcMain.on('ipc-media-man', async (event, arg) => {

  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  //console.log(msgTemplate(arg));
  event.reply('ipc-media-man', msgTemplate('pong'));
});



if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');


  const EXTENDED_MDL_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'extended-commands')
    : path.join(__dirname, '../../extended-commands');


    log.debug("EXTENDED_MDL_PATH", EXTENDED_MDL_PATH);



  // DBを保存するディレクトリ名
  // C:\Users\{ユーザー名}\AppData\Roaming\media-man
  let APP_DIR = path.join(app.getPath('appData'), "media-man");
  try {
    if( fs.existsSync(APP_DIR) == false ) {
      fs.mkdirSync(APP_DIR);
    }
  } catch(e) {
    console.error("mkdirSync", e);
  }


  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  // 設定情報をロード
  try {
    ConfigAcc.load();
  } catch (e) {
    log.error("Error Config JSON.", e, "File:", path.join(RESOURCES_PATH, ConfigAcc.CONDIG_JSON_FNAME) );
    // 読み込みに失敗した場合は、デフォルト値をセット。
  }

  // DBファイルのパス
  const getDbPath = (): string => {
    if( ConfigAcc.db_name === "" ) {
      console.error("ConfigAcc.db_name is empty.");
      ConfigAcc.db_name = 'media-man.db';
    }
    return path.join(APP_DIR, "media-man.db");
  };
  // DBのテーブル作成
  const createDb = async () => {
    const g_db = new SqlImpl( getDbPath() );
    await g_db.createTblIfNotExit();
    g_db.close();
  };
  try {
    await createDb();
  } catch(e) {
    log.error("Error Create DB.", e, "CopnnStr:", getDbPath() );
  }

  // 拡張コマンドをロードします。
  try {
    let filePathExtCmd = path.join(EXTENDED_MDL_PATH, './extended-commands.json' );
    log.debug("extended-commands.json PATH:", filePathExtCmd );
//    if( fs.existsSync(filePathExtCmd) == true ) {
    {
      log.debug("loaing extended-command.", filePathExtCmd);
      gExtCmdConf = require('../../extended-commands/extended-commands.json');
      log.debug(" config of extended-command.", gExtCmdConf);

      if( hasValue(gExtCmdConf.scriptPath) == true ) {
        try {
          let filePathExtMdl= path.join(EXTENDED_MDL_PATH, gExtCmdConf.scriptPath );
          log.debug("loaing extended-command-script.", filePathExtMdl);
          gLoadedExtCmdScript  = require('../../extended-commands/extendCommand.js');
          log.debug("loaded extended-command-script.");
        } catch(e) {
          log.error("Error", "fail to script.extended-commands.", gExtCmdConf.scriptPath, e );
        }
      } else {
        log.warn("not defined scriptPath property. in ", filePathExtCmd);
      }

    }
/*
    else {
      log.debug("dose not exist config of extended-command.", filePathExtCmd);
    }
*/
  } catch(e) {
    log.error("Error", "fail to load extended-commands.", e );
  }

//--------------------------------------------
// open-propertyコマンドの実装
//--------------------------------------------
ipcMain.handle('ipc-open-property', async (event, path) => {
  let retVal:{ret:boolean,msg:string} = { ret: false, msg: "" };
  try {
    winshortcut.openShellProperty("" + path);
    retVal.ret = true;
  } catch (e) {
    retVal.msg = "" + e;
    log.error("Error openShellProperty.", e, "path:", path );
  }
  return retVal;
});
//--------------------------------------------
// open-external-prgコマンドの実装
//--------------------------------------------
ipcMain.handle('ipc-open-external-prg', async (event, path) => {
  let retVal:{ret:boolean,msg:string} = { ret: false, msg: "" };
  try {
    winshortcut.openShellOpen("" + path);
    retVal.ret = true;
  } catch (e) {
    retVal.msg = "" + e;
    log.error("Error openShellOpen.", e, "path:", path );
  }
  return retVal;
});
//--------------------------------------------
// exit-pathマンドの実装
//  指定されたpathが存在するかチェックします。
//--------------------------------------------
ipcMain.handle('ipc-exit-path', async (event, path) => {
  try {
    return fs.existsSync(path);
  } catch(e) {
    console.error("Error", e);
    log.error("Error openShellOpen.", e, "path:", path );
  }
  return false;
});
//----------------------------------------------------------------
//
// フォルダーの選択
//
//---------------------------------------------------------------
ipcMain.on('ipc-elected-folder', async (event, arg) => {
  return await dialog
  .showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
    , defaultPath: '.'
  })
  .then((result)  =>  {
    //console.log(result.canceled);
    //console.log(result.filePaths);
    (async () => {

      if (result.canceled)
      {
        return "";
      }
      event.reply('ipc-elected-folder', 0, result.filePaths[0]);
      return result.filePaths[0];
    })();
  });
});


//--------------------------------------------
// app-configの取得
//--------------------------------------------
// app.configのkinds一覧を取得
ipcMain.handle('ipc-get-app-config-kinds', async (event) => {
  return ConfigAcc.kinds;
});
// app.configのsub-kinds一覧を取得
ipcMain.handle('ipc-get-app-config-sub-kinds', async (event) => {
  return ConfigAcc.subKinds;
});



//--------------------------------------------
// get-configコマンド（設定情報の取得）の実装
//--------------------------------------------
ipcMain.handle('ipc-get-config', async (event, strKey) => {
  let db:SqlImpl|null = null;
  try {
    let ret:string|undefined = "";
    db = new SqlImpl( getDbPath() );
    ret = await db.getTConfig(strKey);
    return ret == undefined ? "" : ret;
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});

//--------------------------------------------
// get-configコマンド（設定情報の取得）の実装
//--------------------------------------------
ipcMain.handle('ipc-set-config', async (event, strKey, strValue) => {
  let db:SqlImpl|null = null;
  try {
    let ret:string|undefined = ""

    db = new SqlImpl( getDbPath() );
    await db.addTConfig(strKey, strValue);
    return strValue;
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});

//--------------------------------------------
// ipc-get-query-dataコマンド（絞り込み情報を取得）の実装
//--------------------------------------------
ipcMain.handle('ipc-get-query-data', async (event, UID:number, GID:number) => {
  let db:SqlImpl|null = null;
  try {
    let ret:CK_QUERY_DATA|undefined;
    db = new SqlImpl( getDbPath() );
    ret = await db.getQueryData(UID, GID);
    return ret;
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});

//--------------------------------------------
// ipc-set-query-dataコマンド（絞り込み情報を取得）の実装
//--------------------------------------------
ipcMain.handle('ipc-set-query-data', async (event, UID:number, GID:number
  , Favorite:number|undefined, QueryTitle:string|undefined) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    await db.addQueryData(UID, GID, Favorite, QueryTitle);
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});


//--------------------------------------------
// get-breadcrumbコマンド（設定情報の取得）の実装
//--------------------------------------------
ipcMain.handle('ipc-breadcrumb', async (event, strClass, strID) => {
  try {
    let ret:BreadcrumbData[] = [];
    let iClass = parseInt("" + strClass);
    let ID = parseInt("" + strID);


    if(  ID == -1 ) { // Homeの場合は、－1が指定されます。
      return ret;
    }
    ret = await getBreadcrumbData( getDbPath() ,
      iClass, ID);
    return ret;
  } catch(e) {
    console.log("Error", e);
  } finally {
  }
});

//----------------------------------------------------------------
//
//  ipc-import-from-strage
//
//----------------------------------------------------------------
ipcMain.on('ipc-import-from-strage', async (event, arg) => {
  let db:SqlImpl|null = null;
  try {
    event.reply('ipc-import-from-strage', 1, "proccessing...");

    db = new SqlImpl( getDbPath() );
    let strages = await db.getStrages();
    db.close();

    let data = listGroupAndFilesRecursively(strages,
      {
        isRecursivle:true, // 再帰的
        isGroupOnly:false,  // グループのみ
        isGetMetaDeta:false,  // メタデータを取得
      },
      undefined, (proc:number,msg:string) => {
      event.reply('ipc-import-from-strage', proc, msg);
    });
    let prom = await importDataInDb( getDbPath() , data,
      {
        isGroupOnly: false,
        isGetMetaDeta: false
      },
      (proc:number,msg:string) => { event.reply('ipc-import-from-strage', proc, msg); }
    );
    event.reply('ipc-import-from-strage', 0, "complete");

  } catch(e) {
    console.log("Error", e);
    event.reply('ipc-import-from-strage', -1, e);
  } finally {
  }
});


//----------------------------------------------------------------
//
// Import-EX処理
//
//---------------------------------------------------------------
ipcMain.on('ipc-import-ex', async (event, arg) => {

  let db:SqlImpl|null = null;
  try {
    if( arg.length != 3 ) {
      log.error("ipc-import-ex","arguments error.", arg);
      return ;
    }
    //console.log("arg:", arg);
    let GID:number = arg[0];
    let srcDir:string = arg[1];
    let dstDir:string = arg[2];
    let outputFile:string = path.join(APP_DIR, "output.txt");

    fs.writeFileSync( outputFile, "\n");


    db = new SqlImpl( getDbPath() );


    function cbLog(proc:number,msg:string)
    {
      if(proc < 0 )  {
        log.error(msg);
        fs.appendFileSync( outputFile, "[ERR] " + msg + "\n");
      } else {
        log.info(msg);
        fs.appendFileSync( outputFile, "[MSG] " + msg + "\n");
      }
      event.reply('ipc-sendmsg-grp', proc, msg);
    }


    let procGIDs:number[] = await importEx(db
      , GID
      , srcDir
      , dstDir
      ,{
        isRecursivle:true, // 再帰的
        isGroupOnly:false,  // グループのみ
        isGetMetaDeta:false,  // メタデータを取得
      },
      undefined, cbLog
    );

    for( let iGroupId of procGIDs )
    {
      let group = await db.getClsGroupByGID( iGroupId );
      if( group == undefined )
      {
        cbLog(-101, `fail to load group.` + iGroupId);
        continue;
      }


      // ファイルの一覧をリストアップ
      //  convItemTBL3Cls内で、ファイル一件一件、存在を確認すると、処理が遅くなるので、
      //  ファイルを先にメモリーにリストアップして、そのリストにファイルがある確認するように
      //   している。
      let listFiles:string[] = [];
      let listLinkedID:number[] = [];
      listupChildFiles( Object.values(group.strages),  listFiles);


      // グループに紐づくアイテム一覧を取得
      let files = await db.getItemsAtGID(GID);
      for(let itm of files)
      {
        // convItemTBL3Cls内でファイルの存在をチェックしないように、第3引数に、falseを指定。
        let item:ImpleFile = await db.convItemTBL3Cls(itm , group, false );

        // リスト内にファイルがあるか？
        item.isCanAccsess = isExistStringList(item.strFullPath, listFiles);

        group.files.push(item);
      }

      // 追加されたファイルや削除されてファイルがないかチェックします。
      await updateCheckAtGroup(group, db,
        undefined,
        cbLog
      );

    }

    event.reply('ipc-sendmsg-grp', 0, "complete");
    db.close();

    exec('cmd /c notepad.exe ' + outputFile, (err:any, stdout:any, stderr:any) => {
      if (err) {
        console.log(`stderr: ${stderr}`)
        return
      }
      console.log(`stdout: ${stdout}`)
    }
  );

  } catch(e) {
    log.error("Error", e);
    event.reply('ipc-import-ex', 0, "");
  } finally {
  }

});


//----------------------------------------------------------------
//
// 重複チェック処理
//
//---------------------------------------------------------------
ipcMain.on('ipc-dup-check', async (event, arg) => {
  let db:SqlImpl|null = null;
  try {
    let outputFile:string = path.join(APP_DIR, "output.txt");
    db = new SqlImpl( getDbPath() );
    fs.writeFileSync( outputFile, "\n");


    function cbLog(proc:number,msg:string)
    {
      if(proc < 0 )  {
        log.error(msg);
        fs.appendFileSync( outputFile, "[ERR] " + msg + "\n");
      } else {
        log.info(msg);
        fs.appendFileSync( outputFile, "[MSG] " + msg + "\n");
      }
      event.reply('ipc-sendmsg-grp', proc, msg);
    }

    await fileDupCheck(db, arg[0], "", cbLog );

    event.reply('ipc-sendmsg-grp', 0, "complete");
    db.close();

    exec('cmd /c notepad.exe ' + outputFile, (err:any, stdout:any, stderr:any) => {
        if (err) {
          console.log(`stderr: ${stderr}`)
          return
        }
        console.log(`stdout: ${stdout}`)
      }
    );


  } catch(e) {
    log.error("Error", e);
    event.reply('ipc-dup-check', 0, "");
  } finally {
  }
});
//----------------------------------------------------------------
//
// GroupDetail画面からのImport処理
//
//----------------------------------------------------------------
ipcMain.on('ipc-sendmsg-grp', async (event, args) => {
  let db:SqlImpl|null = null;
  try {
    event.reply('ipc-sendmsg-grp', 1, "proccessing...");

    let iGroupId:number = 0;
    let bExtCommand:boolean = false;
    if( args.length == 0 )
    {
      log.error("args.length  is zero.");
      event.reply('ipc-sendmsg-grp', -1, "args.length  is zero.");
      return ;
    }
    iGroupId = parseInt("" + args[0])
    if( args.length != 1 )
    {
      // 拡張コマンド無し
      bExtCommand = true;
    }

    db = new SqlImpl( getDbPath() );
    let group = await db.getClsGroupByGID( iGroupId );
    if( group == undefined )
    {
      event.reply('ipc-sendmsg-grp', -1, "Not found group.");
      return ;
    }

    function cbLog(proc:number,msg:string)
    {
      if(proc < 0 )  {
        log.error(msg);
      } else {
        log.info(msg)
      }
      event.reply('ipc-sendmsg-grp', proc, msg);
    }


    if( bExtCommand == false )
    {
      for (let key in group!.strages) {
        // Config JSONの情報を取り込み
        if( loadConfigJson(
              group!.strages[key],
              group,
              cbLog
        ) == true) {

        }
        // ファイルをリストアップ
        let data = listGroupAndFilesRecursivelySpGroup(
            group!.strages[key],
            key,
            group,
            {
              isRecursivle:false, // 再帰的
              isGroupOnly:false,  // グループのみ
              isGetMetaDeta:true,  // メタデータを取得
            },
            undefined,
            cbLog
        );
      }

      // グループ情報をDBに登録
      await importDataInDbAtGroup(db, group, group.PARENT_GID ,
        new GRP_INTEGRQTE(),
        {
            isGroupOnly:false
          , isGetMetaDeta:true
        },
        cbLog
      );

      // リンク情報を解決します。
      await resolveLinkAtGroup(db, group,
        cbLog
      );


      // サムネイル画像を作成します。
      await makeThumbnailRecur(db, group,
        ConfigAcc.kinds,
        ConfigAcc.subKinds,
        cbLog
      );

      // 更新日時を更新します。
      for( let fileD of group.files )
      {
        try {
          let fstat = fs.statSync(fileD.strFullPath);
          await db.updItemAtLatestCheck(fileD.IID, fstat.mtime );
        } catch( ex ) {
          log.error('updItemAtLatestCheck error. IID', fileD.IID, '.  e=', ex );
        }
      }
      await db.updGroupAtLatestCheck(group.GID);
    }
    else
    {
      if( gLoadedExtCmdScript === undefined )
      {
        event.reply('ipc-sendmsg-grp', -1, "Extended command script not loaded.");
        return ;
      }

      // グループに紐づくアイテム一覧を取得
      let files = await db.getItemsAtGID(iGroupId);
      for(let itm of files)
      {
        let item:ImpleFile = await db.convItemTBL3Cls(itm , group);
        group.files.push(item);
      }

      await gLoadedExtCmdScript.execGroupCommand(args[1], gExtCmdConf, db, group,
        cbLog
      );

    }
    event.reply('ipc-sendmsg-grp', 0, "complete");
    db!.close();
  } catch(e) {
    console.log("Error", e);
    event.reply('ipc-sendmsg-grp', -1, e);
  } finally {

  }
});


//--------------------------------------------
// GroupDetailの拡張コマンドのメニュー情報を返します。
//--------------------------------------------
ipcMain.handle('ipc-extend-command-menu-gpoup', async (event, args) => {
  try {
    if( gLoadedExtCmdScript != undefined )
    {
      log.debug("ipc-extend-command-menu-gpoup. kind:", args[0], " subKind:", args[1]);
      let ret =  gLoadedExtCmdScript.getGroupMenu(args[0], args[1]);
      log.debug("ipc-extend-command-menu-gpoup. ret:", ret );
      return ret;
    } else {
      log.debug("gLoadedExtCmdScript is undefined.");
    }
    return [];
  } catch(e) {
    console.log("Error", e);
  } finally {
  }
});
//--------------------------------------------
// listFilesRecursivelyコマンドの実装
//--------------------------------------------
ipcMain.handle('ipc-listFilesRecursively', async (event, arg) => {
  let db:SqlImpl|null = null;
});

//--------------------------------------------
// load-stragesコマンドの実装
//--------------------------------------------
ipcMain.handle('ipc-load-strages', async (event, arg) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    let strages = await db.getStrages();
    return strages;
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});

//--------------------------------------------
// add-stragesコマンドの実装
//--------------------------------------------
ipcMain.handle('ipc-add-strages', async (event, SID, Path) => {
  let db:SqlImpl|null = null;
  let retVal:{ret:boolean} = {
    ret: false
  };

  try {
    db = new SqlImpl( getDbPath() );
    await db.addStrage(
      {SID:SID, Path:Path}
    );

    retVal.ret = true;
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});
//--------------------------------------------
// del-stragesコマンドの実装
//--------------------------------------------
ipcMain.handle('ipc-del-strages', async (event, SID) => {
  let db:SqlImpl|null = null;
  let retVal:{ret:boolean} = {
    ret: false
  };

  try {

    db = new SqlImpl( getDbPath() );
    await db.delStrage(SID);

    retVal.ret = true;
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});



//--------------------------------------------
// グループ
//--------------------------------------------
// load-groupsコマンドの実装
ipcMain.handle('ipc-load-groups', async (event, PARENT_GID) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    let groups = await db.getGroups(PARENT_GID);

    return groups;
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});
// ipc-load-groups-simpleコマンドの実装
ipcMain.handle('ipc-load-groups-simple', async (event, PARENT_GID) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    let groups = await db.getGroupsSimple(PARENT_GID);

    return groups;
  } catch(e) {
    console.log("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});
// get-groupコマンドの実装
ipcMain.handle('ipc-get-group', async (event, GID) => {
  let db:SqlImpl|null = null;
  try {
    log.debug('ipc-get-group GID:', GID);

    db = new SqlImpl( getDbPath() );
    let group:ImpleGroup|undefined;
    if( GID == -1 ) {
      // Home（Root）の場合。
      group= await db.getClsRootGroup();
    } else {
      // 指定グループの場合。
      group= await db.getClsGroupByGID(GID);
    }
    if( group != undefined )
    {
      // ファイルの一覧をリストアップ
      //  convItemTBL3Cls内で、ファイル一件一件、存在を確認すると、処理が遅くなるので、
      //  ファイルを先にメモリーにリストアップして、そのリストにファイルがある確認するように
      //   している。
      let listFiles:string[] = [];
      let listLinkedID:number[] = [];
      listupChildFiles( Object.values(group.strages),  listFiles);


      // グループに紐づくアイテム一覧を取得
      let files = await db.getItemsAtGID(GID);
      for(let itm of files)
      {
        // convItemTBL3Cls内でファイルの存在をチェックしないように、第3引数に、falseを指定。
        let item:ImpleFile = await db.convItemTBL3Cls(itm , group, false );

        // リスト内にファイルがあるか？
        item.isCanAccsess = isExistStringList(item.strFullPath, listFiles);

        group.files.push(item);
      }


      function cbLog(proc:number,msg:string)
      {
        if(proc < 0 )  {
          log.error(msg);
        } else {
          log.info(msg)
        }
        //event.reply('ipc-sendmsg-grp', proc, msg);
      }
      if( hasValue(group.LatestCheck) == true ) {
        // 初期アクセス

        // 追加されたファイルや削除されてファイルがないかチェックします。
        await updateCheckAtGroup(group, db,
          undefined,
          cbLog
        );
      }
    } else {
      log.warn(`group is undefined.`);
    }
    return group;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});
// groupのお気に入り度変更を実装
ipcMain.handle('ipc-upd-group-favorite', async (event, GID:number, iFav:number) => {
  let db:SqlImpl|null = null;
  let retVal:{ret:boolean} = {
    ret: false
  };
  try {
    db = new SqlImpl( getDbPath() );
    await db.updGroup(GID, {Favorite:iFav  });

    // config.jsonを更新します。
    retVal.ret = await updJsonConfig(GID, db, undefined  );
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});
// groupの情報を更新
ipcMain.handle('ipc-upd-group', async (event
        , GID:number
        , updObj:any
        , objConfigJson:any) => {

  let db:SqlImpl|null = null;
  let retVal:{ret:boolean} = {
    ret: false
  };
  try {
    db = new SqlImpl( getDbPath() );
    await db.updGroup(GID, updObj);

    // config.jsonを更新します。
    retVal.ret = await updJsonConfig(GID, db
      , objConfigJson
    );
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});
// グループ間の紐づけを更新します。
ipcMain.handle('ipc-upd-grelation', async (event, GID:number, gids:number[]) => {
  let db:SqlImpl|null = null;
  let retVal:{ret:boolean} = {
    ret: false
  };
  try {
    db = new SqlImpl( getDbPath() );
    await db.updGRelation(GID, gids);

    // config.jsonを更新します。
    retVal.ret = await updJsonConfig(GID, db, undefined  );
    retVal.ret = true;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});

// グループ（フォルダー）を作成可能かチェックします。
ipcMain.handle('ipc-can-add-group', async (event, dir: string, newName: string) => {
  let retVal:{ret:number} = {
    ret: 0
  };
  try {
    newName = newName.trim();
    log.debug('ipc-can-add-group[', dir, '/', newName, ']');
    // フォルダーにアクセス可能か？
    if (fs.existsSync(dir ) == false ) {
      retVal.ret = -1;
      return retVal;
    }
    // 既に存在していないか？
    if (fs.existsSync(path.join(dir, newName) ) == true ) {
      retVal.ret = -2;
      return retVal;
    }
    retVal.ret = 0;
  } catch(e) {
    console.error("Error", e);
  } finally {

  }
  return retVal;
});

// グループ（フォルダー）を作成します。
ipcMain.handle('ipc-add-group', async (event, GID: number, dirs: string[], newName: string) => {
  let retVal:{ret:any,msg:string} = {
    ret: undefined,
    msg:""
  };
  let db:SqlImpl|null = null;
  //newName = newName.trim();

  log.debug("ipc-add-group  GID:", GID, ' dirs:[', dirs, '] newName:[', newName, ']');

  // フォルダーを作成
  try {
    db = new SqlImpl( getDbPath() );

    retVal.ret = await addGroup(db, GID, dirs, newName, undefined,
      (proc:number,msg:string) => {
        if(proc < 0 )  {
          retVal.msg = msg;
          log.error(msg);
        } else {
          log.info(msg)
        }
      }
    );
  } catch(e) {
    console.error("mkdirSync", e);
    return retVal;
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});

// 指定したGROUPの設定情報を保尊する先のストレージIDを取得します。
ipcMain.handle('ipc-get-group-save-sid', async (event, GID: number) => {
  let retVal:string|undefined = "";
  let db:SqlImpl|null = null;
  // フォルダーを作成
  try {

    let group:ImpleGroup|undefined;

    db = new SqlImpl( getDbPath() );

    group= await db.getClsGroupByGID(GID);

    retVal = await getJsonConfigFileStrageID(group);

  } catch(e) {
    log.error("ipc-get-group-save-sid", e);
    return retVal;
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});

// 指定したGROUPの設定情報を保尊する先のストレージIDを変更します。
ipcMain.handle('ipc-change-group-save-sid', async (event, GID: number, SID:string) => {
  let retVal:string|undefined = "";
  let db:SqlImpl|null = null;
  // フォルダーを作成
  try {

    let group:ImpleGroup|undefined;

    db = new SqlImpl( getDbPath() );

    group= await db.getClsGroupByGID(GID);

    retVal = await changeJsonConfigFileStrageID(group, SID);

  } catch(e) {
    log.error("ipc-change-group-save-sid", e);
    return retVal;
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});


//--------------------------------------------
// アイテム
//--------------------------------------------
// get-itemコマンドの実装
ipcMain.handle('ipc-get-item', async (event, IID) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    let item = await db.getClsItemByIID(IID);
    if( item != undefined ){

      // まだメタ情報をロードしていない。
      function cbLog(proc:number,msg:string)
      {
        if(proc < 0 )  {
          log.error(msg);
        } else {
          log.info(msg)
        }
        //event.reply('ipc-sendmsg-grp', proc, msg);
      }
      if( hasValue(item.LatestCheck) == false )
      {
          await updateItemMetaData(item, db, cbLog);
      }
      if( item.linkItem != undefined ) {
        if( hasValue(item.linkItem.LatestCheck) == false )
        {
            await updateItemMetaData(item.linkItem, db, cbLog);
        }
      }

      if( item!.ext == "mp3") {
        // MP3からID3タグを取得
        try {
          let id3 = await getID3TagFromMP3File( item!.strFullPath );
          if( id3 != undefined ) {
            item!.RawTags = id3;
          }
        } catch(e) {
          // エラーは無視します
          log.error("Error in ipc-get-item", e);
        }
      }
      else
      if( item!.ext == "jpg" || item!.ext == "png") {
        // JPEG画像の場合
        try {
          let exif = await getExifFromImgeFile( item!.strFullPath );
          if( exif != undefined ) {
            item!.RawTags = exif;
          }
        } catch(e) {
          // エラーは無視します
          log.error("Error in ipc-get-item", e);
        }
      }
    }

    return item;
  } catch(e) {
    log.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});
// ipc-get-items-where-genre
ipcMain.handle('ipc-get-items-where-genre', async (event, GENRE_ID:number, iPageLimit:number, iPageOffset:number) => {
  let db:SqlImpl|null = null;
  let ret:ImpleFile[] = [];
  try {
    db = new SqlImpl( getDbPath() );
    let files = await db.getItemsWhereGenre(GENRE_ID, iPageLimit, iPageOffset);
    //log.log("files", files);
    if( files != undefined )
    {
      for(let itm of files)
      {
        let item:ImpleFile = await db.convItemTBL3Cls(itm , null);
        ret.push(item);
      }
    }
    return ret;
  } catch(e) {
    log.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return ret;
});
// ipc-upd-item-current-timeコマンドの実装
ipcMain.handle('ipc-upd-item-current-time', async (event, IID, CurrentTime) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    await db.updItemAtCurrentTime(IID, CurrentTime);
  } catch(e) {
    log.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});
ipcMain.handle('ipc-upd-item-favorite', async (event, IID:number, iFav:number) => {
  let db:SqlImpl|null = null;
  let retVal:{ret:boolean} = {
    ret: false
  };
  try {
    db = new SqlImpl( getDbPath() );
    await db.updItem(IID, {Favorite:iFav  });
    retVal.ret = true;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});
// T_ITEMテーブルのPalyCountをプラス１します。
ipcMain.handle('ipc-inc-item-playcount', async (event, IID:number) => {
  let db:SqlImpl|null = null;
  let ret:number = 0;
  try {
    db = new SqlImpl( getDbPath() );


    let item = await db.getItemByIID(IID);
    if( item != undefined )
    {
      if(item.PlayCount != undefined)
      {
        ret = item.PlayCount;
      }
      ret++;
      await db.updItem(IID, {PlayCount:ret});
    }
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return ret;
});
// T_ITEMテーブルのPalyCountをプラス１します。
ipcMain.handle('ipc-get-count-of-items-where-genreid', async (event, IID:number) => {
  let db:SqlImpl|null = null;
  let ret:number = 0;
  try {
    db = new SqlImpl( getDbPath() );


    ret = await db.getItemCountWhereGenreID(IID);
    return ret;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return ret;
});

// itemのサムネイル画像を作成
ipcMain.handle('ipc-item-reimport', async (event, IID) => {
  let db:SqlImpl|null = null;
  let errorMsg = {msg:""};
  try {
    db = new SqlImpl( getDbPath() );
    let item = await db.getClsItemByIID(IID);
    if( item != undefined ){
      await metadetaImportItem(db, item, errorMsg);
    }
  } catch(e) {
    log.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return errorMsg.msg;
});

// itemのサムネイル画像を作成
ipcMain.handle('ipc-item-make-thumbnail', async (event, IID) => {
  let db:SqlImpl|null = null;
  let errorMsg = {msg:""};
  try {
    db = new SqlImpl( getDbPath() );
    let item = await db.getClsItemByIID(IID);
    if( item != undefined ){
      let strPath = await makeThumbnail(item, errorMsg);
      log.debug(strPath, strPath);
      if( strPath != "") {
        await db.updItem(IID, {ArtWork:strPath});
      }
    }
  } catch(e) {
    log.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return errorMsg.msg;
});
// itemの情報を更新
ipcMain.handle('ipc-upd-item', async (event, IID:number, updObj:any) => {
  let db:SqlImpl|null = null;
  let retVal:{ret:boolean} = {
    ret: false
  };
  try {
    db = new SqlImpl( getDbPath() );
    await db.updItem(IID, updObj);
    retVal.ret = true;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});
// itemの削除
ipcMain.handle('ipc-del-item', async (event, IID:number) => {
  let db:SqlImpl|null = null;
  let retVal:{ret:boolean,msg:string} = {
    ret: false,
    msg:""
  };
  try {
    db = new SqlImpl( getDbPath() );

    let br = await delItemReal(db, IID);
    //await db.delItem(IID);

    // リンクファイルがある場合は、リンクファイルを先に削除します。

    retVal.ret = br;
  } catch(e) {
    log.error("Error", e);
    retVal.msg = "" + e;
  } finally {
    if( db != null ) { db.close(); }
  }
  return retVal;
});
// ipc-get-linked-items
ipcMain.handle('ipc-get-linked-items', async (event, IID:number) => {
  let db:SqlImpl|null = null;
  let retVal:{ret:boolean,msg:string} = {
    ret: false,
    msg:""
  };
  try {
    db = new SqlImpl( getDbPath() );

    let linkedItems = await db.getItemsAtILinkdIIDs([IID]);
    db.close();
    db = null;

    return linkedItems;
  } catch(e) {
    log.error("Error", e);
    retVal.msg = "" + e;
  } finally {
    if( db != null ) { db.close(); }
  }
  return undefined;
});


//--------------------------------------------
// ジャンル
//--------------------------------------------
// ipc-load-genres  ジャンル一覧を取得
ipcMain.handle('ipc-load-genres', async (event) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    let strages = await db.getGenres();
    return strages;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});
// ipc-get-genre-name  ジャンル名を取得
ipcMain.handle('ipc-get-genre-name', async (event, GENRE_ID) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    let genre = await db.getGenreByID(GENRE_ID);
    return genre.Name;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});

//--------------------------------------------
// タグ
//--------------------------------------------
// ipc-load-tags  タグ一覧を取得
ipcMain.handle('ipc-load-tags', async (event) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    let tags = await db.getTags();
    return tags;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});
// ipc-get-tag-name  タグ名を取得
ipcMain.handle('ipc-get-tag-name', async (event, TAG_ID) => {
  let db:SqlImpl|null = null;
  try {
    db = new SqlImpl( getDbPath() );
    let tag = await db.getTagByID(TAG_ID);
    return tag.Name;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
});

ipcMain.handle('ipc-get-items-where-tag', async (event, GENRE_ID:number, iPageLimit:number, iPageOffset:number) => {
  let db:SqlImpl|null = null;
  let ret:ImpleFile[] = [];
  try {
    db = new SqlImpl( getDbPath() );
    let files = await db.getItemsWhereTag(GENRE_ID, iPageLimit, iPageOffset);
    //console.log("files", files);
    if( files != undefined )
    {
      for(let itm of files)
      {
        let item:ImpleFile = await db.convItemTBL3Cls(itm , null);
        ret.push(item);
      }
    }
    return ret;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return ret;
});
ipcMain.handle('ipc-get-count-of-items-where-tagid', async (event, IID:number) => {
  let db:SqlImpl|null = null;
  let ret:number = 0;
  try {
    db = new SqlImpl( getDbPath() );


    ret = await db.getItemCountWhereTagID(IID);
    return ret;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return ret;
});

//--------------------------------------------
// フリーワード検索
//--------------------------------------------
ipcMain.handle('ipc-get-count-of-search-free-word', async (event, word: string) => {
  let db:SqlImpl|null = null;
  let ret:number|undefined = 0;
  try {
    db = new SqlImpl( getDbPath() );

    ret = await db.countOfResultSearchFreeWord(word);
    return ret;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return ret;
});
ipcMain.handle('ipc-search-free-word', async (event, word: string, iPageLimit:number, iPageOffset:number) => {
  let db:SqlImpl|null = null;
  let ret:any;
  try {
    db = new SqlImpl( getDbPath() );
    ret = await db.searchFreeWord(word, iPageLimit, iPageOffset);
    return ret;
  } catch(e) {
    console.error("Error", e);
  } finally {
    if( db != null ) { db.close(); }
  }
  return ret;
});





  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      /*
        webSecurity: falseにしないと、<audio>タグの srcに、ローカルファイル(file:///c:/...)
        の指定がアクセスエラーになるため、設定しています。
      */
      webSecurity: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */
app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
