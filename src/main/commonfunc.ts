import path from 'path';
import fs, { Dirent } from 'fs';
import ConfigAcc from "./config-acc";
import NodeID3 from 'node-id3';
import ffmpeg from 'fluent-ffmpeg';
import { ImpleGroup, ImpleFile, GRP_INTEGRQTE } from './class-def';
import { SqlImpl, importDataInDbAtFile, importDataInDbAtGroup, makeThumbnailAtItem, resolveLinkAtFile } from './sql-impl';
import { warn } from 'console';
const log = require('electron-log');

const { ExifImage } = require('exif');
const winshortcut = require('winshortcut');

// 指定した値が、undefined|null|空文字でないか確認
export function hasValue(value: any | undefined | null): boolean {
  if (value == undefined) {
    return false;
  }
  if (value == null) {
    return false;
  }
  if (typeof value === 'string') {
    if (value.length == 0) {
      return false;
    }
  }
  return true;
}

export function getMIMEType2Extention(memi: string): string {
  if (memi == 'JPG') {
    return 'jpg';
  }
  if (memi == 'image/jpeg') {
    return 'jpg';
  }
  if (memi == 'image/png') {
    return 'jpg';
  }
  if (memi == 'image/gif') {
    return 'gif';
  }
  return '';
}

export function isFirstCharAlphabet(str: string) {
  // 正規表現を使用して最初の文字がアルファベットかどうかをチェック
  return /^[A-Za-z]/.test(str);
}

export function isFirstCharNumber(str: string) {
  // 正規表現を使用して最初の文字が数値かどうかをチェック
  return /^[0-9]/.test(str);
}

export function isExistFile(filePath: string) {
  return fs.existsSync(filePath);
}

// ショートカットのリンク先のファイルパスを取得
export function getShortcutDestinationPath(linkFilePath: string) {
  return winshortcut.getAbsoltePath(linkFilePath);;
}


// Date型を文字列に変換します。
export function getDateTime2String(dateTime: Date):string {
  return dateTime.toUTCString();
}
// 文字列から、Date型に変換します。
export function getString2DateTime(strDateTime: string):Date {
  return new Date( strDateTime );
}


// 指定したファイル名からコード文字を取得
export function getCodeString(strFileName: string) {
  let mcode: string = '';
  try {
      if (isFirstCharAlphabet(strFileName) == true) {
        // 最初のスペース
        let idxCode = strFileName.indexOf(' ');
        if (idxCode != -1) {
          const strCode = strFileName.substring(0, idxCode);
          idxCode = strCode.indexOf('-');
          if (idxCode != -1) {
            const strNumber = strCode.substring(idxCode + 1);
            if (isFirstCharNumber(strNumber) == true) {
              mcode = strCode;
            }
          }
        }
      }
      else
      if( isFirstCharNumber(strFileName) == true )
      {
          // 最初のスペース
          let idxCode = strFileName.indexOf(" ");
          if( idxCode != -1 )
          {
              let strCode =  strFileName.substring(0, idxCode);
              idxCode = strCode.indexOf("-");
              if( idxCode != -1 )
              {
                  let strNumber =  strCode.substring(idxCode+1);
                  if( isFirstCharNumber(strNumber) == true )
                  {
                      mcode = strCode;
                  }
              }
          }
      }
  }
  catch(e)
  {
    log.error("getCodeString:", e);
  }
  return mcode;
}

/*
  ディレクトリ名から、名前を分割します。
  NameFとNameLとい属性が、アンダースコア(_)を区切りに文字として,
  ディレクトリ名に含まれているものしています。

  NameF_{重要度|無し}NameL
  Ex.
  * NameL有りかつ、重要度あり
    Fujii Kaze_★藤井風
  * NameL有り、重要度無し
    Okamoto Tarou_岡本太郎
  * NameL無し、重要度あり
    Perl Jam_★
  * NameL無し、重要度無し
    Nirvana
*/
export function splitGroupName(name: string): {
  nameF: string;
  nameL: string;
  important: number;
} {
  const ret: { nameF: string; nameL: string; important: number } = {
    nameF: '',
    nameL: '',
    important: 0,
  };

  let idx = -1;
  let strNameF = '';
  let strNameL = '';

  idx = name.indexOf('★');
  if (idx != -1) {
    ret.important = 99;
    const str1 = name.substring(0, idx).trim();
    const str2 = name.substring(idx + 1).trim();

    name = str1 + str2;
  }

  idx = name.indexOf('▼');
  if (idx != -1) {
    ret.important = 50;
    const str1 = name.substring(0, idx).trim();
    const str2 = name.substring(idx + 1).trim();

    name = str1 + str2;
  }
  idx = name.indexOf('_');
  if (idx != -1) {
    strNameF = name.substring(0, idx).trim();
    strNameL = name.substring(idx + 1).trim();
  } else {
    strNameF = name;
  }
  ret.nameF = strNameF;
  ret.nameL = strNameL;

  return ret;
}

//-------------------------------------------
// Config JSONファイルのパスを取得します。
// ${DIR}/.media-mon/config.json　があれば、そのパス。ない場合は、${DIR}/config.json
//-------------------------------------------
export function getConfigJsonFilePath(currentDir: string):string
{
  const strConfigJsonPath: string = path.join(currentDir, ConfigAcc.CONDIG_DIR_NAME, ConfigAcc.CONDIG_JSON_FNAME);
  if (fs.existsSync(strConfigJsonPath) == true) {
    return strConfigJsonPath;
  }
  return path.join(currentDir, ConfigAcc.CONDIG_JSON_FNAME);
}


//-------------------------------------------
// Config JSONの情報を取り込み
//-------------------------------------------
export function loadConfigJson(
  currentDir: string,
  group: ImpleGroup,
  funcProc?: Function,
): boolean {
  const strConfigJsonPath: string = getConfigJsonFilePath(currentDir);

  if (fs.existsSync(strConfigJsonPath) == false) {
    // 存在しない。
    return false;
  }
  const strConfigJsonDir = path.dirname(strConfigJsonPath);

  try {
    const config: any = JSON.parse(fs.readFileSync(strConfigJsonPath, 'utf8'));

    if (config.kind != undefined) {
      group.Kind = ConfigAcc.getKindInt(config.kind);
    }
    if (config.subKind != undefined) {
      group.SubKind = ConfigAcc.getSubKindInt(config.subKind);
    }
    if (config.artWork != undefined) {
      group.ArtWork = path.join(strConfigJsonDir, config.artWork);
    }
    group.Name = config.name ?? group.Name;
    group.SearchName = config.searchName ?? group.SearchName;
    if( !config.favorite ) {
      group.Favorite = config.favorite ?? group.Favorite;
    }
    group.Comment = config.comment ?? group.Comment;
    group.integrateGroup = config.integrateGroup ?? group.integrateGroup;
    let isMaster: boolean = config.isMaster ?? true; // isMaster:false が設定されているのみ、isMaster=falseとなり、それ以外はtrue

    if (group.config == undefined) {
      group.config = config;
      group.ConfigJson = JSON.stringify(config);
    } else if (isMaster == true) {
      // 既にロード済みだが、、Masterの場合は、上書き
      group.config = config;
      group.ConfigJson = JSON.stringify(config);
    }
    return true;
  } catch (ex) {
    if (funcProc != undefined) {
      funcProc(-200, `config.json read error.(${strConfigJsonPath})`);
    }
  }
  return false;
}


//-------------------------------------------
//グループ名統合オプションを、親グループに遡って取得します。
//-------------------------------------------
export function getGroupRecurOpt(strDir:string) : GRP_INTEGRQTE
{
  let opt:GRP_INTEGRQTE = new GRP_INTEGRQTE();
  let strConfigPath:string  = getConfigJsonFilePath(strDir);

  //log.debug("getGroupRecurOpt", strConfigPath);

  if (fs.existsSync(strConfigPath) == true) {
    try {
      const config: any = JSON.parse(fs.readFileSync(strConfigPath, 'utf8'));
      if( config!.recurIntegrateGroup != undefined )
      {
        opt.recurIntegrateGroup = config!.recurIntegrateGroup;
      }
      if( config!.recurMaster != undefined )
      {
        opt.recurMaster = config!.recurMaster;
      }

      if( config!.recurKind != undefined )
      {
        opt.recurKind = ConfigAcc.getKindInt( config!.recurKind );
      }
      if( config!.recurSubKind != undefined )
      {
        opt.recurSubKind = ConfigAcc.getSubKindInt( config!.recurSubKind );
      }

      //log.debug("GRP_INTEGRQTE:", opt);
      //log.debug("config:", config);
    } catch(e) {
      log.error("fail to load config.json.", e);
    }
  }
  return opt;
}

//-------------------------------------------
//
//-------------------------------------------
function isTargetRegistFile(name: string, fullPath: string, targetExts: string[]) {
  name = name.toLocaleLowerCase();
  if (name.endsWith('.lnk')) {
    // リンクファイルの場合、リンク先のファイルの拡張子をチェックします。
    try {
      const strLinkTarget: string = winshortcut.getAbsoltePath(fullPath);
      return isTargetRegistFile(strLinkTarget, fullPath, targetExts);
    } catch (e) {
      console.error('getAbsoltePath Error!!', fullPath);
    }
    return false;
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const ext of targetExts) {
    const extd = `.${ext}`;
    if (name.endsWith(extd)) {
      return true;
    }
  }
  return false;
}
//-------------------------------------------
//  指定したグループ直下のアイテムの更新状態を確認して、
//  新規アイテムがある場合は登録。
//  削除されている場合は、削除します。
//-------------------------------------------
export async function  updateCheckAtGroup(group:ImpleGroup
  , db:SqlImpl
  , funcSpltGrpName?: Function
  , funcProc?: Function
  )
{
    // 追加されたファイルや削除されてファイルがないかチェックします。
    log.debug("####### Checking directory.");
    let hasCannotAccessStrage:boolean = false;

    for(let fileD of group.files)
    {
      fileD.DelMark = 1;
    }
    for(let subgroup of group.subgroupsArray)
    {
      subgroup.DelMark = 1;
    }

    for(let SID in group.strages)
    {
      let strage = group.strages[SID];
      log.debug('checking strage:[', strage, '].');
      //log.debug("strage", strage);
      if (fs.existsSync(strage) == false) {
        log.debug('cannot access strage:[', strage, '].');
        hasCannotAccessStrage = true;
      }
      else
      {
        // グループ名統合情報を取得
        let RecurOpt:GRP_INTEGRQTE = getGroupRecurOpt(strage);

        const entries = fs.readdirSync(strage, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(strage, entry.name);

          if (entry.isDirectory()) {
            //
            //  ディレクトリの場合。
            //
            if (entry.name == ConfigAcc.CONDIG_DIR_NAME) {
              // .midia-mon ディレクトリは対象外
              continue;
            }
            let bFound:boolean = false;
            let bFoundSameStrage:boolean = false; // グループは存在するが、ストレージは別な場合。

            // ディレクトリ(ImpleGroup)の場合
            let names: { nameF: string; nameL: string; important: number; newName:string }
                = parseGrpName(entry.name, funcSpltGrpName);

            let foundImpleGroup:ImpleGroup|null = null;
            for(let subgroup of group.subgroupsArray)
            {
              if( subgroup.DirName == names.newName  )
              {
                foundImpleGroup = subgroup;
                subgroup.DelMark = 0;
                bFound = true;
                for( let SID in subgroup.strages )
                {
                  if( subgroup.strages[SID] == fullPath )
                  {
                    bFoundSameStrage = true;
                  }
                }
                break;
              }
            }
            if( RecurOpt.recurIntegrateGroup == true && RecurOpt.recurMaster == false && bFound == false )
            {
                let exitData = await db.getGroupByDirName( names.newName );
                if( exitData != undefined ) {
                  bFound = true;
                  let strageOnGrp = await db.getGroup2StragesAsArray(exitData.GID);
                  if( strageOnGrp[SID] == fullPath ) {
                    bFoundSameStrage = true;
                  }
                }
            }
            if( bFound == false )
            {
              // グループ名統合(RecurOpt.recurIntegrateGroup == true ) && スレーブ(RecurOpt.recurMaster==false)の場合、
              // 他グループに、マスターのグループがあるかもしれないので、検索します。
              log.debug('New Group:[', fullPath, ']. Integrate:', RecurOpt.recurIntegrateGroup, ' IsMaster:', RecurOpt.recurMaster);

              let newgroup = new ImpleGroup(names.newName, names.nameL, names.nameF);
              group.subgroupsArray.push(newgroup);

              newgroup.Favorite = names.important;
              newgroup.strages[SID] = fullPath;

              // config.jsonがある場合は、読み込みます。
              loadConfigJson(fullPath, newgroup, funcProc);

              // グループ情報をDBに登録
              await importDataInDbAtGroup(db, newgroup, group.GID ,
                RecurOpt,
                {
                    isGroupOnly:false
                  , isGetMetaDeta:false
                },
                funcProc
              );
            }
            else if( bFoundSameStrage == false ) {
              // グループはあるが、別ストレージにディレクトリが作成された。
              log.debug('New GroupStrage:[', SID, ':', fullPath, '].');
              if( foundImpleGroup != null ) {
                await db.addGroup2Strage(foundImpleGroup.GID, SID, fullPath);
                foundImpleGroup.strages[SID] = fullPath;
              }
            }
          } else {
            //
            //  ファイルの場合。
            //
            if (entry.name == ConfigAcc.CONDIG_JSON_FNAME) {
              continue;
            }
            if( fullPath == group.ArtWork ) {
              continue;
            }
            if( isTargetRegistFile(entry.name, fullPath, ConfigAcc.targetExts) == false )
            {
              continue;
            }


            let foundImpleFile:ImpleFile|null = null;
            for(let fileD of group.files)
            {
              if( fileD.strFullPath == fullPath )
              {
                fileD.DelMark = 0;
                foundImpleFile = fileD;
                break;
              }
            }
            if( foundImpleFile == null )
            {
              log.debug("New File:[", fullPath, "].");

              const newItem = new ImpleFile(entry.name, SID);
              newItem.strFullPath = fullPath;
              if (funcProc != undefined) {
                funcProc(3, `listup file.${newItem.name}`);
              }

              // メタデータを取得
              let props: any;
              try {
                  props = winshortcut.getProps(newItem.strFullPath);
                  if (funcProc != undefined) {
                    funcProc(3, `Getting Meta Data.${newItem.name}`);
                  }
              } catch (ex) {
                console.error('winshortcut -> catch: error =', { ex });
                props = undefined;
              }
              newItem.RawTags = props;

              // DBに登録
              newItem.PARENT_GID = group.GID;
              await importDataInDbAtFile(db, newItem, funcProc);

              // リンク情報を解決します。
              await resolveLinkAtFile(db, newItem, funcProc);

              // サムネイル画像を作成します。
              await makeThumbnailAtItem( db , newItem , group , funcProc);

              // 更新日時を更新します。
              try {
                let fstat = fs.statSync(newItem.strFullPath);
                await db.updItemAtLatestCheck(newItem.IID, fstat.mtime );
              } catch( ex ) {
                log.error('updItemAtLatestCheck error. IID', newItem.IID, '.  e=', ex );
              }

              group.files.push(newItem);
            } else {
              // 更新日時をチェックします。
              try {
                let fstat = fs.statSync(fullPath);
                let mtime = getDateTime2String(fstat.mtime);
                if( mtime != foundImpleFile.LatestCheck ) {
                  log.debug("UpDate File:", fullPath);

                  // MetaDataを取得して、DB更新
                  let props: any;
                  try {
                      props = winshortcut.getProps(foundImpleFile.strFullPath);
                      if (funcProc != undefined) {
                        funcProc(3, `Getting Meta Data.${foundImpleFile.name}`);
                      }
                  } catch (ex) {
                    console.error('winshortcut -> catch: error =', { ex });
                    props = undefined;
                  }
                  foundImpleFile.RawTags = props;


                  foundImpleFile.PARENT_GID = group.GID;
                  await importDataInDbAtFile(db, foundImpleFile, funcProc);

                  // 更新日時を更新します。
                  try {
                    let fstat = fs.statSync(foundImpleFile.strFullPath);
                    await db.updItemAtLatestCheck(foundImpleFile.IID, fstat.mtime );
                  } catch( ex ) {
                    log.error('updItemAtLatestCheck error. IID', foundImpleFile.IID, '.  e=', ex );
                  }
                }
              } catch(e) {
                log.error("updItemAtLatestCheck", e);
              }
            }
          }
        }
      }
    }
    if( hasCannotAccessStrage == false )
    {
      let newSubGrp:ImpleGroup[] = [];
      for(let subgroup of group.subgroupsArray)
      {
        if( subgroup.DelMark == 1 )
        {
          log.debug("Delete Group:[", subgroup.Name, ']');
          await db.delGroup(subgroup.GID);
        } else {
          newSubGrp.push(subgroup);
        }
      }
      group.subgroupsArray = newSubGrp;


      let newFiles:ImpleFile[] = [];
      for(let fileD of group.files)
      {
        if( fileD.DelMark == 1 )
        {
          log.debug("Delete File:[", fileD.strFullPath, ']');
          await db.delItem(fileD.IID);
          log.debug("end");
        }else {
          newFiles.push(fileD);
        }
      }
      group.files = newFiles;
    }
    log.debug("####### End Checking directory.");
}

//-------------------------------------------
//  指定されたファイルから、メタ情報を取得して、ＤＢを更新します。
//-------------------------------------------
export async function updateItemMetaData(item:ImpleFile
  , db:SqlImpl
  , funcProc?: Function
  )
{
  log.debug("#   Start updateItemMetaData");
  try {
    let fullPath:string = item.strFullPath;

    let fstat = fs.statSync(fullPath);
    let mtime = getDateTime2String(fstat.mtime);

    // MetaDataを取得して、DB更新
    let props: any;
    try {
        props = winshortcut.getProps(item.strFullPath);
        if (funcProc != undefined) {
          funcProc(3, `Getting Meta Data.${item.name}`);
        }
    } catch (ex) {
      console.error('winshortcut -> catch: error =', { ex });
      props = undefined;
    }
    item.RawTags = props;

    // DB情報を登録
    await importDataInDbAtFile(db, item, funcProc);
    // サムネイルを作成
    if( hasValue( item.ArtWork ) == false ) {
      try {
        let strArtwork = await makeThumbnail(item);
        if( strArtwork != "" )
        {
          item.ArtWork = strArtwork;
          await db.updItem( item.IID, {ArtWork:strArtwork} );
        }
      } catch(e) {
        log.error("makeThumbnailAtItem", e);
        if( funcProc != undefined ) {
          funcProc(-105, "make thumbnail error." + e);
        }
      }
    }


    // 更新日時を更新します。
    try {
      let fstat = fs.statSync(item.strFullPath);
      await db.updItemAtLatestCheck(item.IID, fstat.mtime );
      item.LatestCheck = getDateTime2String(fstat.mtime);
    } catch( ex ) {
      log.error('updateItemMetaData error. IID', item.IID, '.  e=', ex );
    }
    log.debug("#   End updateItemMetaData");
  } catch(e) {
    log.error("updateItemMetaData", e);
  }
}

function parseGrpName(name:string, funcSpltGrpName?: Function):
   {
    nameF: string;
    nameL: string;
    important: number;
    newName: string;
  }
{
  // ディレクトリ(ImpleGroup)の場合
  let names: { nameF: string; nameL: string; important: number; } = {
    nameF: name,
    nameL: '',
    important: 0,
  };
  if (funcSpltGrpName != undefined) {
    names = funcSpltGrpName!(name);
  } else {
    // ユーザ指定のFunctionが省略された場合、デフォルト関数を使用
    names = splitGroupName(name);
  }
  let newName = names.nameF;
  if (names.nameL.length != 0) {
    newName += '_';
    newName += names.nameL;
  } else {
    names.nameL = names.nameF;

    // 検索文字(names.nameF）に、"The "や"a "で始まる文字があれば、カットして小文字に変換しておく。
    if (names.nameF.length > 4) {
      names.nameF = names.nameF.toLocaleLowerCase();
      if (names.nameF.startsWith('the ') == true) {
        names.nameF = names.nameF.substring(4);
        names.nameF = names.nameF.trim();
      }
    }
    if (names.nameF.length > 2) {
      names.nameF = names.nameF.toLocaleLowerCase();
      if (names.nameF.startsWith('a ') == true) {
        names.nameF = names.nameF.substring(2);
        names.nameF = names.nameF.trim();
      }
    }
  }
  return {
    nameF: names.nameF,
    nameL: names.nameL,
    important: names.important,
    newName: newName
  };
}
//-------------------------------------------
//
//-------------------------------------------
export function listupChildFiles( dirs:string[], chiledFiles:string[])
{
  try
  {
      for( let dir of dirs)
      {
        if (fs.existsSync(dir) == false) {
            continue;
        } else {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            chiledFiles.push(fullPath);
          }
        }
      }
  } catch( e ) {
      log.error("listupChildFiles", e);
  }
}
//-------------------------------------------
//
//-------------------------------------------
export function isExistStringList( strFind:string, listString:string[])
{
    for(let s of listString) {
      if( s === strFind ) {
        return true;
      }
    }
    return false;
}


//-------------------------------------------
// グループを追加
//-------------------------------------------
export async function addGroup(
    db:SqlImpl
  , PARENT_GID: number
  , dirs: string[]
  , newName: string
  , funcSpltGrpName?: Function
  , funcProc?: Function): Promise<ImpleGroup | undefined>
{
  let group:ImpleGroup;
  let strages:{[key: string]: string};


   // ストレージ一覧を取得
   try {
    strages = await db.getStragesAsArray();
  } catch(e) {
    if (funcProc != undefined) {
      funcProc(-200, `fail to get strage.` + e);
    }
    return undefined;
  }
  // フォルダーを作成
  try {
    for(let dir of dirs )
    {
        let strNewDir = path.join(dir, newName);
        fs.mkdirSync(strNewDir);
    }
  } catch(e) {
    if (funcProc != undefined) {
      funcProc(-200, `fail to create directory.` + e);
    }
    return undefined;
  }


  let recurOts:GRP_INTEGRQTE = new GRP_INTEGRQTE;

  // ディレクトリ(ImpleGroup)の場合
  let names: { nameF: string; nameL: string; important: number; newName:string
  } = parseGrpName(newName, funcSpltGrpName);

  group = new ImpleGroup(names.newName, names.nameL, names.nameF);
  group.PARENT_GID = PARENT_GID;
  group.Favorite = names.important == 0 ? undefined : names.important;
  if (funcProc != undefined) {
    funcProc(3, `listup group.${group.Name}`);
  }
  for(let dir of dirs )
  {
    for(let key in strages)
    {
      if( dir.startsWith( strages[key] ) == true ) {
        group.strages[key] = path.join(dir, newName);

        let trmpOpts:GRP_INTEGRQTE =  getGroupRecurOpt(dir);
        if( trmpOpts != undefined ) {
          if( trmpOpts.recurMaster === true ) {
            recurOts = trmpOpts;
          }
        }
        break;
      }
    }
  }

  log.debug("recurOts", recurOts);

  try
  {
    // DBに登録
    await importDataInDbAtGroup(db , group , group.PARENT_GID , recurOts
      , {
        isGroupOnly:true,
        isGetMetaDeta:false
      }
      , funcProc);

  } catch(e) {
    if (funcProc != undefined) {
      funcProc(-200, `fail to add DB.` + e);
    }
    return undefined;
  }
  return group;
}



//-------------------------------------------
//
//-------------------------------------------
export function listGroupAndFilesRecursivelySpGroup(
  currentDir: string,
  SID: string,
  parentGroup: ImpleGroup,
  options?: {
    isRecursivle: boolean | undefined; // 再帰的
    isGroupOnly: boolean | undefined; // グループのみ
    isGetMetaDeta: boolean | undefined; // メタデータを取得
  },
  funcSpltGrpName?: Function,
  funcProc?: Function,
) {


  if (fs.existsSync(currentDir) == false) {
    if (funcProc != undefined) {
      funcProc(-200, `cannot access direcory[.${currentDir}]`);
    }
    return;
  }
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name == ConfigAcc.CONDIG_DIR_NAME) {
        // .midia-mon ディレクトリは対象外
        continue;
      }

      // ディレクトリ(ImpleGroup)の場合
      let names: { nameF: string; nameL: string; important: number; newName:string
                 } = parseGrpName(entry.name, funcSpltGrpName);


      let group: ImpleGroup = parentGroup.subgroups[names.newName];
      if (group == null) {
        group = new ImpleGroup(names.newName, names.nameL, names.nameF);
        parentGroup.subgroups[names.newName] = group;
      }
      group.Favorite = names.important == 0 ? undefined : names.important;
      if (funcProc != undefined) {
        funcProc(3, `listup group.${group.Name}`);
      }
      group.strages[SID] = fullPath;

      // config.jsonがある場合は、読み込みます。
      loadConfigJson(fullPath, group, funcProc);

      // 再帰的に呼び出す。
      if (options!.isRecursivle == true) {
        listGroupAndFilesRecursivelySpGroup(
          fullPath,
          SID,
          group,
          options,
          funcSpltGrpName,
          funcProc,
        );
      }
    } else if (entry.name == ConfigAcc.CONDIG_JSON_FNAME) {
      // 先読みしているので、スルーします。
    } else if (options!.isGroupOnly == false) {
      // ファイル(ImpleFile)の場合
      const strFName = entry.name;
      // eslint-disable-next-line no-inner-declarations
      if (isTargetRegistFile(entry.name, fullPath, ConfigAcc.targetExts)) {
        const fileD = new ImpleFile(strFName, SID);
        fileD.PARENT_GID = parentGroup.GID;
        fileD.strFullPath = fullPath;
        if (funcProc != undefined) {
          funcProc(3, `listup file.${fileD.name}`);
        }

        // 実ファイルを取得
        let props: any;
        try {
          if (options!.isGetMetaDeta == true) {
            props = winshortcut.getProps(fileD.strFullPath);
            if (funcProc != undefined) {
              funcProc(3, `Getting Meta Data.${fileD.name}`);
            }
          }
        } catch (ex) {
          console.error('winshortcut -> catch: error =', { ex });
          props = undefined;
        }
        fileD.RawTags = props;

        parentGroup!.files.push(fileD);
      }
    }
  }
}
//-------------------------------------------
// 指定したストレージを再帰的に検索て、グループ＆アイテム情報をリストアップします。
//-------------------------------------------
export function listGroupAndFilesRecursively(
  strages: { SID: string; Path: string }[],
  options?: {
    isRecursivle: boolean | undefined; // 再帰的
    isGroupOnly: boolean | undefined; // グループのみ
    isGetMetaDeta: boolean | undefined; // メタデータを取得
  },
  funcSpltGrpName?: Function,
  funcProc?: Function,
): { [key: string]: ImpleGroup } {

  let returnGroups:{ [key: string]: ImpleGroup } = {};

  // ストレージのパスに指定されたディレクトリを再帰的にサーチします。
  for (const key of strages) {
    if (fs.existsSync(key.Path) == true) {

      const dummyGrp: ImpleGroup = new ImpleGroup('', '', '');
      // config.jsonがある場合は、読み込みます。
      loadConfigJson(key.Path, dummyGrp, funcProc);


      listGroupAndFilesRecursivelySpGroup(
        key.Path,
        key.SID,
        dummyGrp,
        options,
        funcSpltGrpName,
        funcProc,
      );

      returnGroups[key.SID] = dummyGrp;
    } else if (funcProc != undefined) {
      funcProc(-18, `Directory dose not exist. ${key.Path}`);
    }
  }



  // ファイルがリンクされているリスト情報を作成
  function buildLinkedListSubProc(
    fileD: ImpleFile,
    grps: { [key: string]: ImpleGroup },
  ) {
    for (const key2 in grps) {
      const group2 = grps[key2];
      for (const fileD2 of group2.files) {
        if (fileD != fileD2) {
          if (fileD.strLinkTarget == fileD2.strFullPath) {
            fileD2.cntLinked.push(fileD);
          }
        }
      }
      buildLinkedListSubProc(fileD, group2.subgroups);
    }
  }
  function buildLinkedList(grps: { [key: string]: ImpleGroup }) {
    for (const key in grps) {
      const group = grps[key];
      for (const fileD of group.files) {
        if (fileD.isLink == true) {
          buildLinkedListSubProc(fileD, grps);
        }
      }
      buildLinkedList(group.subgroups);
    }
  }
  for(let key in returnGroups) {
    buildLinkedList(returnGroups[key].subgroups);
  }

  return returnGroups;
}


//-------------------------------------------
// 外部ディレクトリを指定して、指定グループ直下にインポートします。
//-------------------------------------------
export async function importEx(
  db:SqlImpl,
  GID:number,
  currentDir:string,
  destinationDir:string,
  options?: {
    isRecursivle: boolean | undefined; // 再帰的
    isGroupOnly: boolean | undefined; // グループのみ
    isGetMetaDeta: boolean | undefined; // メタデータを取得
  },
  funcSpltGrpName?: Function,
  funcProc?: Function,
) {
  let procGIDs:number[] = [];

  const dummyGrp: ImpleGroup = new ImpleGroup('', '', '');
  listGroupAndFilesRecursivelySpGroup(
    currentDir,
    "dummy",
    dummyGrp,
    options,
    funcSpltGrpName,
    funcProc,
  );

  let dbgrps = await db.getGroups( GID );
  for( const key in dummyGrp.subgroups)
  {
    let targetGid:number = -1;
    let grp = dummyGrp.subgroups[key];
    if (funcProc != undefined) {
      funcProc(200, `Proccessing. [${grp.Name }]`);
    }

    for(let dbgrp of dbgrps)
    {
      if( dbgrp.Name == grp.Name )
      {
        targetGid = dbgrp.GID;
        break;
      }
    }

    if( targetGid ! -1 )
    {
      let strStrage:string = "";
      //console.log("Find GID:" + targetGid, " Name:",  grp.Name);
      let strages = await db.getGroup2Strages(targetGid);

      for(let tmpStrage of strages)
      {
        if( tmpStrage.Path.startsWith(destinationDir) == true )
        {
          strStrage = tmpStrage.Path;
          break;
        }
      }

      if( strStrage.length != 0 )
      {
        console.log("  Strage:", strStrage);
        procGIDs.push( targetGid );

        for(let file of grp.files)
        {
          //console.log("  file:", file.name);

          let strDstPath = path.join(strStrage, file.name);
          let strSrcPath = file.strFullPath;

          //console.log("  strDstPath:", strDstPath);
          //console.log("  strSrcPath:", strSrcPath);

          try {
            if (funcProc != undefined) {
              funcProc(200, `  copy. ` + strSrcPath + " -> " + strDstPath );
            }
            if( fs.existsSync(strDstPath) == true )
            {
              if (funcProc != undefined) {
                funcProc(200, `  already exist file. ` + strSrcPath  );
              }
            }
            else
            {
              fs.copyFileSync(strSrcPath, strDstPath);

              if (funcProc != undefined) {
                funcProc(200, `  remove. ` + strSrcPath  );
              }
              fs.unlinkSync( strSrcPath );
            }
          }
          catch( e )
          {
            if (funcProc != undefined) {
              funcProc(-200, `exception. ` + e );
            }
          }
        }
      } else {
        if (funcProc != undefined) {
          funcProc(-200, `group-strage does not exist. [${grp.Name }]`);
        }
        console.log("  Strage not exist.");
      }
    }
    else
    {
      if (funcProc != undefined) {
        funcProc(-200, `group does not exist. [${grp.Name }]`);
      }
    }
  }

  return procGIDs;
}


//-------------------------------------------
// 外部ディレクトリを指定して、指定グループ直下にインポートします。
//-------------------------------------------
export async function fileDupCheck(
  db:SqlImpl,
  PARENT_GID:number,
  strGrpArtwork:string,
  funcProc?: Function
) {
  // サブグループを再帰的に探索する
  let grps = await db.getGroups(PARENT_GID);
  for(let grp of grps)
  {
    if (funcProc != undefined) {
      //funcProc(200, `Proccessing... [${grp.Name }]`);
    }
    await fileDupCheck(db, grp.GID, grp.ArtWork!, funcProc);
  }

  let files = await db.getItemsAtGID(PARENT_GID);
  for(let file of files)
  {
    if( file.DelMark != 0 ) {
      continue;
    }
    // リンクファイルは対象外
    if( file.LinkIID != 0 )
    {
      continue;
    }
    // リンクファイルは対象外
    if( file.Ext == "lnk" )
    {
      continue;
    }
    // アートワークのファイルは対象外
    if( strGrpArtwork == file.FullPath )
    {
      continue;
    }


    // 同一ファイル名のファイルがあるかチェック
    if (funcProc != undefined) {
      //funcProc(200, `  Proccessing... [${file.Name }]`);
    }

    let bfind:boolean = false;

    let dupfiles = await db.getItemsAtName(file.Name!);
    for(let dupfile of dupfiles)
    {
      if( dupfile.DelMark != 0 ) {
        continue;
      }
      if( dupfile.IID != file.IID )
      {
        bfind = true;

        if (funcProc != undefined) {
          funcProc(200, `[${file.Name }]` + dupfile.IID  + "/" + file.IID  );
          funcProc(200, `  ${file.FullPath }`);
          let iLink1Cnt = 0;
          let iLink2Cnt = 0;
          // リンク先をチェック
          let link1s = await db.getItemsAtILinkdIIDs([ file.IID ]);
          for(let link1 of link1s)
          {
            funcProc(200, `    Link->${link1.FullPath }`);
            iLink1Cnt++;
          }
          funcProc(200, `  ${dupfile.FullPath }`);
          // リンク先をチェック
          link1s = await db.getItemsAtILinkdIIDs([ dupfile.IID ]);
          for(let link1 of link1s)
          {
            funcProc(200, `    Link->${link1.FullPath }`);
            iLink2Cnt++;
          }

          if( dupfile.FullPath === file.FullPath )
          {
            funcProc(200, `    Samu Full Path Regist. `);
            if( iLink2Cnt == 0 ) {
              funcProc(200, `    Delete ` + dupfile.IID );
              await db.delItem( dupfile.IID );
            } else
            if( iLink1Cnt == 0 ) {
              funcProc(200, `    Delete ` + file.IID );
              await db.delItem( file.IID );
            }
          }
          else
          {
            // 親が削除されたアイテムでないかチェック
            let parentGrp = await db.getGroupByGID( file.PARENT_GID );
            if( parentGrp == undefined ) {
              funcProc(200, `    FileID:` + file.IID + ". Lost parent" );
              await db.delItem( file.IID );
            }
            parentGrp = await db.getGroupByGID( dupfile.PARENT_GID );
            if( parentGrp == undefined ) {
              funcProc(200, `    FileID:` + dupfile.IID + ". Lost parent" );
              await db.delItem( dupfile.IID );
            }
          }

        }

      }

    }

    if( bfind == false && hasValue(file.Code) )
    {
      let bPrintFn:boolean = false;
      // Codeで同じものがないか確認
      let dupcodes = await db.getItemsAtCode(file.Code!);
      for(let dupcode of dupcodes)
      {
        if( dupcode.DelMark != 0 ) {
          continue;
        }
        // リンクファイルは対象外
        if( dupcode.Ext == "lnk" )
        {
          continue;
        }

        if( dupcode.IID != file.IID )
        {

          if (funcProc != undefined) {
            let strSize = "";
            if( bPrintFn == false ) {
              funcProc(200, `DupCode:[${file.Name }]` );
              try {
                let stat = fs.statSync( file.FullPath! );
                if( stat.size > (1024*1024)) {
                  strSize = "" + Math.round((stat.size/(1024*1024))) + " MB";
                } else if( stat.size > (1024)) {
                  strSize = "" + Math.round((stat.size/(1024))) + " KB";
                } else {
                  strSize = "" + stat.size;
                }
              } catch( e){
              }
              funcProc(200, `  ${file.FullPath }\t${strSize}`);
              let link1s = await db.getItemsAtILinkdIIDs([ file.IID ]);
              for(let link1 of link1s)
              {
                funcProc(200, `    Link->${link1.FullPath }`);
              }

              bPrintFn = true;
            }
            strSize = "";
            try {
              let stat = fs.statSync( dupcode.FullPath! );
              if( stat.size > (1024*1024)) {
                strSize = "" + Math.round((stat.size/(1024*1024))) + " MB";
              } else if( stat.size > (1024)) {
                strSize = "" + Math.round((stat.size/(1024))) + " KB";
              } else {
                strSize = "" + stat.size;
              }
            } catch( e){
            }
            funcProc(200, `  ${dupcode.FullPath }\t${strSize}`);
            {
              let link1s = await db.getItemsAtILinkdIIDs([ dupcode.IID ]);
              for(let link1 of link1s)
              {
                funcProc(200, `    Link->${link1.FullPath }`);
              }
            }
          }
        }
      }
    }

  }

}

//-------------------------------------------
// 外部ディレクトリを指定して、指定グループ直下にインポートします。
//-------------------------------------------
export async function delItemReal(
  db:SqlImpl,
  IID:number
) {
  log.info("Delete ITRM:", IID);
  let item =  await db.getItemByIID(IID);
  if( item == undefined ) {
    log.error("fail to getItemByIID:", IID);
    return false;
  }
  // リンク情報を削除
  let links = await db.getItemsAtILinkdIIDs([IID]);
  for(let link of links)
  {
    try
    {
      log.info(" link file delete:", link.FullPath);
      fs.unlinkSync(link.FullPath!);
    } catch( e ) {
      log.error("fail to unlinkSync", link.FullPath, e);
      return false;
    }

    log.info(" link item delete:", link.IID);
    await db.delItemLinkedItem(IID, link.IID);
    await db.delItem( link.IID );
  }

  try
  {
    log.info(" file delete:", item.FullPath);
    fs.unlinkSync(item.FullPath!);
  } catch( e ) {
    log.error("fail to unlinkSync", item.FullPath, e);
    return false;
  }
  log.info(" item delete:", IID);
  await db.delItem( IID );

  return true;
}


//-------------------------------------------
// MP3ファイルから、ID3タグ情報を取得
//-------------------------------------------
export async function getID3TagFromMP3File(path: string): Promise<any> {
  return new Promise<any>(function (resolve, reject) {
    NodeID3.read(
      path,
      function (err: NodeJS.ErrnoException, tags: NodeID3.Tags | null) {
        if (err) {
          console.log(err);
          reject();
        }
        resolve(tags);
      },
    );
  });
}

// MP3ファイルから、ID3タグ情報を取得
export async function getExifFromImgeFile(path: string): Promise<any> {
  return new Promise<any>(function (resolve, reject) {
    try {
      new ExifImage({ image: path }, function (error: any, image: any) {
        if (error) {
          console.log(`Error in getExifFromImgeFile: ${error.message}`);
          reject();
        } else {
          resolve(image);
        }
      });
    } catch (e) {
      console.error('in getExifFromImgeFile', e);
    }
  });
}

// サムネール画像をクリーンアップします。
export function cleanupThumbnail(group: ImpleGroup) {
  for(let keyStrage in group.strages )
  {
    let dirPath = path.join(group.strages[keyStrage], ConfigAcc.CONDIG_DIR_NAME);

    if (fs.existsSync(dirPath) == true) {
      // ディレクトリがある
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      // eslint-disable-next-line no-restricted-syntax
      for (const entry of entries) {

        if( entry.name.startsWith("thumbnail-at-") === true ) {
          const fullPath = path.join(dirPath, entry.name);
          fs.unlinkSync(fullPath);
        }
      }
    }
  }
}

// メタデータの取り込み
export async function metadetaImportItem(
  db:SqlImpl,
  item: ImpleFile,
  errorMsg:any|undefined = undefined): Promise<string>
{
  try {


    let props: any;
    // プロパティの情報をファイルから取得
    props = winshortcut.getProps(item.strFullPath);
    if( props != undefined )
    {
      item.RawTags = props;

      log.debug("props", props);

      // 取得したプロパティの情報を、DBにセット
      await importDataInDbAtFile(db, item);
    } else {
      log.error('in metadetaImportItem', "プロパティ情報を取得できませんでした。");
      if( errorMsg != undefined) {
        errorMsg.msg = "プロパティ情報を取得できませんでした。";
      }
    }
  } catch (e) {
    log.error('in metadetaImportItem', e);
    if( errorMsg != undefined) {
      errorMsg.msg = "" + e;
    }
  }
  return errorMsg.msg ;
}

// 指定したアイテムのサムネイル画像を作成します
export async function makeThumbnail(item: ImpleFile, errorMsg:any|undefined = undefined): Promise<string> {


  return new Promise<string>(function (resolve, reject) {
    try {
      const strDirName = path.dirname(item.strFullPath);
      const strDirThumbNail = path.join(strDirName, ConfigAcc.CONDIG_DIR_NAME);
      let strFileName = 'thumbnail-at-';
      strFileName += item.IID;
      strFileName += '-seconds.png';
      let strFileNameFullPath = path.join(strDirThumbNail, strFileName);


      if (
        item.ext == 'mp4' ||
        item.ext == 'avi' ||
        item.ext == 'mpeg' ||
        item.ext == 'mov'
      ) {
        const command = ffmpeg(item.strFullPath);
        command
          .on('end', () => {
            resolve(strFileNameFullPath);
          })
          .on('error', (err:any) => {
            log.error(`Cannot process video: ${err.message}`);

            if( errorMsg != undefined) {
              errorMsg.msg = err.message;
            }

            reject(item.name);
          })
          .screenshots({
            count: 1,
            folder: path.join(strDirName, ConfigAcc.CONDIG_DIR_NAME), //
            filename: strFileName, // %iはインデックス番号、%sは秒
            size: '360x?', // 360x?で　、　幅320で縦は可変
          });

      } else if (item.ext == 'mp3' || item.ext == 'm4a') {
        const id3 = getID3TagFromMP3File(item!.strFullPath);
        id3
          .then(function (value) {
            if (value!.image != undefined) {
              const imgeBuff = value!.image!.imageBuffer;
              if (imgeBuff != undefined) {
                strFileName = 'thumbnail-at-';
                strFileName += item.IID;
                strFileName += '-seconds.';
                strFileName += getMIMEType2Extention(value!.image!.mime);
                strFileNameFullPath = path.join(strDirThumbNail, strFileName);
                let binaryData = '';
                for (let i = 0, len = imgeBuff.byteLength; i < len; i++) {
                  binaryData += String.fromCharCode(imgeBuff[i]);
                }

                if (fs.existsSync(strDirThumbNail) == false) {
                  //  ディレクトリ作成
                  fs.mkdirSync(strDirThumbNail);
                }
                fs.writeFileSync(strFileNameFullPath, imgeBuff);

                resolve(strFileNameFullPath);
              }
            } else {
              log.error("ファイルに、アートワーク画像が埋め込まれていません");
              if( errorMsg != undefined) {
                errorMsg.msg = "ファイルに、アートワーク画像が埋め込まれていません";
              }
            }

            resolve('');
          })
          .catch(function (e) {
            log.error('in makeThumbnail', e);
            if( errorMsg != undefined) {
              errorMsg.msg = "" + e;
            }
            reject();
          });
      } else {
        if( errorMsg != undefined) {
          errorMsg.msg = "サムネイル作成対象外のファイルが指定されました。";
        }

        resolve('');
      }
    } catch (e) {
      log.error('in makeThumbnail', e);
      if( errorMsg != undefined) {
        errorMsg.msg = "" + e;
      }
      reject();
    }
  });
}

//-------------------------------------------
// Config.jsonファイルを保存する、ストレージのSIDを取得
export async function getJsonConfigFileStrageID(group:ImpleGroup|undefined)
  :Promise<string>
{
  if( group == undefined ) {
    log.error("Error", "getJsonConfigFilePath");
    return "";
  }
  let strSID:string = "";
  let strConfigDir:string = "";
  let strConfigJSon:string = "";
  if( group.strages == undefined )
  {
    log.error("Error", "group.strages is null.");
    return "";
  }


  if( Object.keys(group.strages).length == 0 )
  {
    //
    //  ストレージが無い
    //
    log.error("Error", "group.strages is zero.");
    return "";
  } else
  if( Object.keys(group.strages).length == 1 )
  {
    //
    //  ストレージが１のみ
    //
      for(let strgKey in group.strages)
      {
        strSID = strgKey;
        strConfigDir = path.join(group.strages[strSID], ConfigAcc.CONDIG_DIR_NAME);
        try {
          if (fs.existsSync(strConfigDir) == false) {
            //  ディレクトリ作成
            fs.mkdirSync(strConfigDir);
          }
        } catch( e ) {
          log.warn("mkdirSync", e);
        }
      }
  }
  else
  {
    //
    //  ストレージが複数
    //
      let strHasConfigJsonSID:string = "";
      for(let strgKey in group.strages)
      {
        let bMaster = false;
        let strStrage = group.strages[strgKey];
        // このグループの親の GRP_INTEGRQTEを取得します。
        let opts:GRP_INTEGRQTE =  getGroupRecurOpt(path.dirname(strStrage));

        strConfigDir = path.join(group.strages[strgKey], ConfigAcc.CONDIG_DIR_NAME);

        let strPath = path.join(strConfigDir, ConfigAcc.CONDIG_JSON_FNAME);

        try {
          if (fs.existsSync(strConfigDir) == false) {
            //  ディレクトリ作成
            fs.mkdirSync(strConfigDir);
          }
        } catch( e ) {
          log.warn("mkdirSync", e);
        }
        if( opts.recurMaster == true )
        {
          // 親から、子へのMaster継承設定がある。
          // このファイルを。マスターに使用。
          bMaster = true;
        } else {


          if (fs.existsSync(strPath ) == true ) {
            // 既に存在している場合、isMaster=falseが設定されていなかチェックします。
            try {
              let config:any = JSON.parse(fs.readFileSync(strPath, 'utf8'));
              if( config.isMaster != undefined )
              {
                bMaster = config.isMaster;
              }

              if( strHasConfigJsonSID == "" ) {
                // config.jsonが存在する場合、その先頭のSIDだけを記憶しておく
                strHasConfigJsonSID = strgKey;
              }
            } catch(ex) {
              log.warn("JSON.parse", ex);
            }
          }
        }
        if( bMaster == true)
        {
          strSID = strgKey;
          break;
        }
      }

      if( strSID == "" )
      {
        // まだ決定しない場合、group.stragesの先頭をConfigの保存先とする。
        if( strHasConfigJsonSID != "" ) {
          // config.jsonが存在するSIDを使用
          strSID = strHasConfigJsonSID;
        }
        else {
          // 先頭のSIDを使用
          strSID = Object.keys(group.strages)[0];
        }
      }
  }
  if( strSID == "" )
  {
    console.error('Could not determine config file path.');
    return "";
  }

  return strSID;
}


//-------------------------------------------
// Config.jsonファイルを保存する、ストレージのSIDを取得
export async function changeJsonConfigFileStrageID( group:ImpleGroup|undefined, SID:string)
  :Promise<string>
{
  if( group == undefined ) {
    log.error("Error", "getJsonConfigFilePath");
    return "group is undefined.";
  }
  if( group.strages == undefined )
  {
    log.error("Error", "group.strages is null.");
    return "group.strages is null.";
  }

  let strOldSID:string =  await getJsonConfigFileStrageID(group);
  let strNewDir:string = group.strages[SID];
  let strOldDir:string = group.strages[strOldSID];
  let strNewJsonPath:string = "";
  let strOldJsonPath:string = "";


  //log.debug("SID", SID);
  //log.debug("strOldSID", strOldSID);

  if( SID == strOldSID )
  {
    // SIDに変化なし
    return "";
  }
  if( strNewDir == undefined) {
    // SIDに変化なし
    log.error("Error", "SID:" + SID + " is invalid.");
    return "SID:" + SID + " is invalid.";
  }

  // 変更元と変更先のディレクトリがアクセス可能である必要があります。
  if (fs.existsSync(strOldDir ) == false ) {
    log.error("Error",  strOldDir + "にアクセスできないので、変更できません。");
    return strOldSID + "にアクセスできないので、変更できません。";
  }
  if (fs.existsSync(strNewDir ) == false ) {
    log.error("Error",  strNewDir + "にアクセスできないので、変更できません。");
    return strNewDir + "にアクセスできないので、変更できません。";
  }

  strNewDir = path.join(strNewDir, ConfigAcc.CONDIG_DIR_NAME);
  strOldDir = path.join(strOldDir, ConfigAcc.CONDIG_DIR_NAME);
  if (fs.existsSync(strOldDir ) == false ) {

  }
  if (fs.existsSync(strNewDir ) == false ) {

  }

  strNewJsonPath = path.join(strNewDir, ConfigAcc.CONDIG_JSON_FNAME);
  strOldJsonPath = path.join(strOldDir, ConfigAcc.CONDIG_JSON_FNAME);

  if (fs.existsSync(strOldJsonPath ) == true ) {
    // 変更元に、config.jsonがある
    try {
      fs.renameSync(strOldJsonPath, strNewJsonPath);
    }  catch(ex) {
      log.error("Error",  ex);
      return "" + ex;
    }
  } else {
    try {
      fs.writeFileSync(strNewJsonPath, JSON.stringify({}, null , "\t"));
    }  catch(ex) {
      log.error("Error",  ex);
      return "" + ex;
    }
  }

  return "";
}


//-------------------------------------------
// Config.jsonに設定情報を書き込み
export async function updJsonConfig(GID:number, db:SqlImpl, objConfigJson:any|undefined )
{
  try {
    let strStrageID:string = "";
    let strConfigDir:string = "";
    let strConfigDirOld:string = "";
    let strConfigJSon:string = "";
    let strConfigJSonOld:string = "";
    //
    //  config.jsonを更新します。
    //
    let group = await db.getClsGroupByGID(GID);
    if( group == undefined ) {
      log.error("Error", "getClsGroupByGID");
      return false;
    }

    // Config.jsonファイルを保存する、ストレージのSIDを取得
    strStrageID = await getJsonConfigFileStrageID(group);
    if( strStrageID == "" )
    {
      console.error('Could not determine config file path.');
      return false;
    }
    strConfigDirOld = group.strages[strStrageID];
    strConfigDir = path.join(group.strages[strStrageID], ConfigAcc.CONDIG_DIR_NAME);

    strConfigJSonOld = path.join(group.strages[strStrageID], ConfigAcc.CONDIG_JSON_FNAME);;
    strConfigJSon = path.join(strConfigDir, ConfigAcc.CONDIG_JSON_FNAME);



    //
    let jsonData:any = {};
    try {
      if( objConfigJson != undefined)
      {
        jsonData = objConfigJson;
      }
      else if( hasValue(group.ConfigJson)) {
        try
        {
          let jsonDataTmp = JSON.parse( group.ConfigJson ?? "{}"  );
          jsonData = jsonDataTmp;
        } catch( e ){
          log.error("JSON.parse", e);
        }
      }
      delete jsonData.kind;
      if( group.Kind != undefined )
      {
        for( let key in ConfigAcc.kinds )
        {
          if( ConfigAcc.kinds[key] == group.Kind )
          {
            jsonData.kind = key;
            break;
          }
        }
      }
      delete jsonData.SubKind;
      if( group.SubKind != undefined )
      {
        for( let key in ConfigAcc.subKinds )
        {
          if( ConfigAcc.subKinds[key] == group.SubKind )
          {
            jsonData.subKind = key;
            break;
          }
        }
      }

      jsonData.name = group.Name;
      jsonData.searchName = group.SearchName;
      delete jsonData.favorite;
      if( group.Favorite != undefined )
      {
        jsonData.favorite = group.Favorite;
      }
      delete jsonData.comment;
      if( group.Comment != undefined )
      {
        jsonData.comment = group.Comment;
      }
      delete jsonData.artWork;
      if( group.ArtWork != undefined )
      {
        const dirPath = path.dirname(strConfigJSon);
        let artWork = group.ArtWork;
        const dirPathArtwork = path.dirname(artWork);
        let artWorkFName = artWork.substring(dirPathArtwork.length + 1);

        /*
          ストレージと同じパスにアートワークイメージがある場合、 以下の処理を行う。
          1. アートワークの画像を.media-manディレクトリーに移動。
          2. DBのArtWorkをフィールドの値を、移動後のパスに書き換える。
        */
        try {
          if( dirPathArtwork == strConfigDirOld )
          {
            log.debug('exist artwork image on strage dir');
            let artWorkNew =  path.join(strConfigDir, artWorkFName);
            log.debug(`move file. ${artWork} -> ${artWorkNew}`);
            fs.renameSync(artWork, artWorkNew);
            // 更新されたConfigJSONを、DBに保存
            await db.updGroup(group.GID, {"ArtWork":artWorkNew} );

            artWork = artWorkNew;
          }
        } catch( e ) {
          log.warn("renameSync", e);
        }



        const dirPathArtWok = path.dirname(artWork);
        if( dirPathArtWok == "" )
        {
          // DBに登録するイメージのパスはフルパスとする
          group.ArtWork = path.join(dirPath, artWork);
        }

        if( artWork.startsWith(dirPath) == true)
        {
          // config.jsonと同じ場所にイメージがある場合は、config.jasonのartWorkは相対パスとする。
          artWork = artWork.substring(dirPath.length + 1);
        }
        jsonData.artWork = artWork;
      }

      delete jsonData.sameGrps;
      if( group.sameGrps != undefined )
      {
        if( group.sameGrps.length != 0 )
        {
          let sameGrpArray = [];
          for(let sameGrp of group.sameGrps)
          {
            sameGrpArray.push(sameGrp.name);
          }
          jsonData.samePersons = sameGrpArray;
        } else {
          delete jsonData.samePersons;
        }
      }

      fs.writeFileSync(strConfigJSon, JSON.stringify(jsonData, null , "\t"));

      // 更新されたConfigJSONを、DBに保存
      await db.updGroup(group.GID, {"ConfigJson":JSON.stringify(jsonData)})

      // 旧config.jsonがある場合は削除する。
      if (fs.existsSync(strConfigJSonOld ) == true ) {
        fs.unlinkSync(strConfigJSonOld);
      }

      return true;
    } catch(ex) {
      console.error('in updJsonConfig', ex);
      return false;
    }

  } catch (e) {
    console.error('in updJsonConfig', e);
    return false;
  }
}


