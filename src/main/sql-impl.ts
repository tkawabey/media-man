import sqlite3 from 'sqlite3';
import {ImpleIdName, ImpleGroup, ImpleFile, BreadcrumbData, GRP_INTEGRQTE} from './class-def';
import { cleanupThumbnail, getDateTime2String, getShortcutDestinationPath, hasValue, isExistFile, makeThumbnail } from './commonfunc';
import log from 'electron-log';
import ConfigAcc from "./config-acc";
const winshortcut = require('winshortcut');

//------------------------------------------------------------
//  T_CONFIG
//      KeyStr	キー	vaechar	256	N	Y
//      ValueStr	値	vaechar	256	N
//------------------------------------------------------------
export type T_CONFIG = {
  KeyStr: string;
  ValueStr: string;
};

//------------------------------------------------------------
//  M_STRAGE
//      SID	ストレージID	vaechar	256	N	Y
//      Path	パス	vaechar	256	N
//------------------------------------------------------------
export type M_STRAGE = {
  SID: string;
  Path: string;
};
//------------------------------------------------------------
//  M_GENRE
//      GENRE_ID	ジャンルID	Int		N	Y
//      Name	ジャンル名	vaechar	256	Y
//------------------------------------------------------------
export type M_GENRE = {
  GENRE_ID: number;
  Name: string;
};
//------------------------------------------------------------
//  M_TAG
//      TAG_ID	タグID	Int		N	Y
//      Name	タグ名	vaechar	256	Y
//------------------------------------------------------------
export type M_TAG = {
  TAG_ID: number;
  Name: string;
};

//------------------------------------------------------------
//  T_DATA_BASE
//      DID	グループID/アイテムID	Int		N	Y
//      PARENT_GID	親グループID	Int		N
//      Name	名前	vaechar	256	N
//      Comment	コメント	vaechar	256
//      Favorite	お気に入り度	Int				0-100
//      ArtWork	アートワーク	vaechar	256
//      Comment	コメント	vaechar	256
//      DelMark	削除マーク	Int
//      LatestCheck	確認日時	vaechar	256
//------------------------------------------------------------


//------------------------------------------------------------
//  T_GROUP
//      GID	グループID	Int		N	Y
//      PARENT_GID	親グループID	Int		N
//      DirName	ディレクトリ名	vaechar	256	N
//      Name	名前	vaechar	256	N
//      SearchName	ローカル名	vaechar	256
//      Favorite	お気に入り	Int				0-1
//      Kind	種類	Int				0:Image/1:Music/2:Video
//      SubKind	分類2	Int				0:Artist/2:Alubam
//      ArtWork	ローカル名	vaechar	256
//      Comment	コメント	vaechar	256
//      ConfigJson	config.jsonの内容	vaechar	256
//      DelMark	削除マーク	Int
//      LatestCheck	確認日時	vaechar	256
//------------------------------------------------------------
export type T_GROUP = {
  GID: number; //	グループID	Int		N	Y
  PARENT_GID: number; //	親グループID	Int		N
  DirName: string; //	ディレクトリ名	vaechar	256	N
  Name: string; //	名前	vaechar	256	N
  SearchName: string; //	ローカル名	vaechar	256
  Favorite: number | undefined; //	お気に入り	Int				0-1
  Kind: number|undefined;//	種類	Int				0:Image/1:Music/2:Video
  SubKind: number|undefined;//	分類2	Int				0:Artist/2:Alubam
  ArtWork: string|undefined;//	ローカル名	vaechar	256
  Comment: string|undefined;//	コメント	vaechar	256
  ConfigJson: string|undefined;//	config.jsonの内容	vaechar	256
  DelMark: number|undefined;//	削除マーク	Int
  LatestCheck: string|undefined;//	確認日時	vaechar	256
};

//------------------------------------------------------------
//  T_GRELATION
//      GID	グループID	Int		N	Y
//      RELATION_GID	関連グループID	Int		N	Y
//------------------------------------------------------------
export type T_GRELATION = {
  GID: number;
  RELATION_GID: number;
};

//------------------------------------------------------------
//  T_GROUP2STRAGE
//      GID	グループID	Int		N	Y
//      SID	ストレージID	vaechar	256	N	Y
//      Path	パス	vaechar	256	N
//------------------------------------------------------------
export type T_GROUP2STRAGE = {
  GID: number;
  SID: string;
  Path: string;
};

//------------------------------------------------------------
//  T_ITEM2GROUP
//      IID	アイテムID	Int		N	Y
//      GID	グループID	Int		N	Y
//------------------------------------------------------------
export type T_ITEM2GROUP = {
  IID: number;
  GID: number;
};

//------------------------------------------------------------
//  T_ITEMLinkITEM
//      IID	アイテムID	Int		N	Y
//      LinkedIID	リンクしているアイテムID	Int		N	Y
//------------------------------------------------------------
export type T_ITEMLinkITEM = {
  IID: number;
  LinkedIID: number;
};

//------------------------------------------------------------
//  T_ITEM
//      IID	アイテムID	Int		N	Y
//      PARENT_GID	親グループID	Int		N
//      SID	ストレージID	vaechar	256	N
//      Name	名前	vaechar	256	N
//      Code	コード	vaechar	256	Y
//      Ext	拡張子	vaechar	256	N
//      LinkIID	リンクアイテムID	Int		N		0-N
//      Favorite	評価	Int		N		0-100
//      Year	年	Int		Y
//      Comment	コメント	vaechar	256	Y
//      Title	タイトル	vaechar	256	Y
//      SubTitle	サブタイトル	vaechar	256	Y
//      AlbumArtist	アルバムアーティスト	vaechar	256	Y
//      Track	トラック	Int		Y
//      PlayTime	時間	vaechar	256	Y
//      CurrentTime	現在の再生時刻	double
//      FrameH	フレーム高	Int		Y
//      FrameW	フレーム幅	Int		Y
//      FrameRate	レート	Int		Y
//      DataRate	データレート	Int		Y
//      SampleRate	サンプルレート	Int		Y
//      SampleSize	サンプルサイズ	Int		Y
//      ChannelCount	チャンネルカウント	Int		Y
//      StreamNumber	ストリームNo	Int		Y
//      ContentType	コンテントタイプ(MIME)	vaechar	256	Y
//      FullPath	フルパス	vaechar	256	Y
//      ArtWork	サムネイル画像情報	vaechar	256
//      PlayCount	再生回数	Int
//      DelMark	削除マーク	Int
//      LatestCheck	確認日時	vaechar	256	Y
//------------------------------------------------------------
export type T_ITEM = {
  IID: number; //	アイテムID	Int		N	Y
  PARENT_GID: number; //	親グループID	Int		N
  SID: string|undefined;//	ストレージID	vaechar	256	N
  Name: string|undefined;//	名前	vaechar	256	N
  Code: string|undefined;//	コード	vaechar	256	Y
  Ext: string|undefined;//	拡張子	vaechar	256	N
  LinkIID: number|undefined; //	リンクアイテムID	Int		N		0-N
  Favorite: number|undefined; //	評価	Int		N		0-100
  Year: number|undefined; //	年	Int		Y
  Comment: string|undefined;//	コメント	vaechar	256	Y
  Title: string|undefined;//	タイトル	vaechar	256	Y
  SubTitle: string|undefined;//	サブタイトル	vaechar	256	Y
  AlbumArtist: string|undefined;//	アルバムアーティスト	vaechar	256	Y
  Track: number|undefined; //	トラック	Int		Y
  PlayTime: string|undefined;//	時間	vaechar	256	Y
  CurrentTime: number|undefined; //	現在の再生時刻	double
  FrameH: number|undefined; //	フレーム高	Int		Y
  FrameW: number|undefined; //	フレーム幅	Int		Y
  FrameRate: number|undefined; //	レート	Int		Y
  DataRate: number|undefined; //	データレート	Int		Y
  SampleRate: number|undefined; //	サンプルレート	Int		Y
  SampleSize: number|undefined; //	サンプルサイズ	Int		Y
  ChannelCount: number|undefined; //	チャンネルカウント	Int		Y
  StreamNumber: number|undefined; //	ストリームNo	Int		Y
  ContentType: string|undefined;//	コンテントタイプ(MIME)	vaechar	256	Y
  FullPath: string|undefined;//フルパス	vaechar	256	Y
  ArtWork: string|undefined;//	サムネイル画像情報	vaechar	256
  PlayCount: number|undefined;//	再生回数	Int
  DelMark: number|undefined;//	削除マーク	Int
  LatestCheck: string|undefined;//	確認日時	vaechar	256	Y
};

//------------------------------------------------------------
//  T_ITEM2TAG
//      IID	アイテムID	Int		N	Y
//      TAG_ID	タグID	Int		N	Y
//------------------------------------------------------------
export type T_ITEM2TAG = {
  IID: number;
  TAG_ID: number;
};

//------------------------------------------------------------
//  T_ITEM2GENRE
//      IID	アイテムID	Int		N	Y
//      GENRE_ID	ジャンルID	Int		N	Y
//------------------------------------------------------------
export type T_ITEM2GENRE = {
  IID: number;
  GENRE_ID: number;
};

//------------------------------------------------------------
// CK_QUERY_DATA
//  UID	未使用。常に０。将来的にユーザーIDにするかも・・・	Int		N	Y
//  GID	グループID	Int		N	Y
//  Favorite	お気に入り	Int		N
//  QueryTitle	絞り込み文字	vaechar	256
//------------------------------------------------------------
export type CK_QUERY_DATA = {
  UID: number;
  GID: number;
  Favorite: number|undefined;
  QueryTitle: string|undefined;
};



type ID_NAME = {
  ID: number;
  NAME: string;
};


//----------------------------------------------------
//
//  DBクエリーの実装
//
//----------------------------------------------------
export class SqlImpl
{
  connectData : string;
  db:sqlite3.Database;


  constructor(connectData:string)
  {
    this.connectData = connectData;
    // DBに接続する。
    this.db = new sqlite3.Database(connectData);
  }

  close()
  {
    this.db!.close();
  }
  //  テーブル作成
  async createTblIfNotExit()
  {
    return new Promise((resolve, reject) => {
      try {
          this.db.serialize(() => {

            let sql = ["create table if not exists T_CONFIG("];
            sql.push("  KeyStr vaechar(256) NOT NULL");
            sql.push(", ValueStr vaechar(256) NOT NULL");
            sql.push(", CONSTRAINT PK_T_CONFIG PRIMARY KEY(KeyStr) ");
            sql.push(");");
            this.db.run(sql.join(" "));

            sql = ["create table if not exists M_STRAGE("];
            sql.push("  SID vaechar(256) NOT NULL");
            sql.push(", Path vaechar(256) NOT NULL");
            sql.push(", CONSTRAINT PK_M_STRAGE PRIMARY KEY(SID) ");
            sql.push(");");
            this.db.run(sql.join(" "));

            sql = ["create table if not exists M_GENRE("];
            sql.push("  GENRE_ID Integer NOT NULL");
            sql.push(", Name vaechar(256) NOT NULL");
            sql.push(", CONSTRAINT PK_M_GENRE PRIMARY KEY(GENRE_ID) ");
            sql.push(");");
            this.db.run(sql.join(" "));

            sql = ["create table if not exists M_TAG("];
            sql.push("  TAG_ID Integer NOT NULL");
            sql.push(", Name vaechar(256) NOT NULL");
            sql.push(", CONSTRAINT PK_M_TAG PRIMARY KEY(TAG_ID) ");
            sql.push(");");
            this.db.run(sql.join(" "));



            sql = ["create table if not exists T_DATA_BASE("];
            sql.push("   DID Integer NOT NULL");
            sql.push(",  PARENT_GID Integer NOT NULL");
            sql.push(",  BaseType Integer NOT NULL");
            sql.push(",  Name vaechar(256) NOT NULL");
            sql.push(",  Comment vaechar(256)");
            sql.push(",  Favorite Integer");
            sql.push(",  ArtWork vaechar(256)");
            sql.push(",  DelMark Integer");
            sql.push(",  LatestCheck vaechar(256)");
            sql.push(", CONSTRAINT PK_T_DATA_BASE PRIMARY KEY(DID) ");
            sql.push(");");
            this.db.run(sql.join(" "));

            sql = ["create table if not exists T_GROUP("];
            sql.push("   GID Integer NOT NULL");
            sql.push(",  DirName vaechar(256) NOT NULL");
            sql.push(",  SearchName vaechar(256)");
            sql.push(",  Kind Integer");
            sql.push(",  SubKind Integer");
            sql.push(",  ConfigJson vaechar(256)");
            sql.push(", CONSTRAINT PK_T_GROUP PRIMARY KEY(GID) ");
            sql.push(");");
            this.db.run(sql.join(" "));


            sql = ["create table if not exists T_GROUP2STRAGE("];
            sql.push("  GID Integer NOT NULL");
            sql.push(", SID vaechar(256) NOT NULL");
            sql.push(", Path vaechar(256) NOT NULL");
            sql.push(", CONSTRAINT PK_T_GROUP2STRAGE PRIMARY KEY(GID, SID) ");
            sql.push(");");
            this.db.run(sql.join(" "));


            sql = ["create table if not exists T_GRELATION("];
            sql.push("  GID Integer NOT NULL");
            sql.push(", RELATION_GID Integer NOT NULL");
            sql.push(", CONSTRAINT PK_T_GRELATION PRIMARY KEY(GID, RELATION_GID) ");
            sql.push(");");
            this.db.run(sql.join(" "));

            sql = ["create table if not exists T_ITEM("];
            sql.push("  IID Integer NOT NULL");
            sql.push(", SID vaechar(256) NOT NULL");
            sql.push(", Code vaechar(256) ");
            sql.push(", Ext vaechar(256) ");
            sql.push(", LinkIID Integer ");
            sql.push(", Year Integer ");
            sql.push(", Title vaechar(256) ");
            sql.push(", SubTitle vaechar(256) ");
            sql.push(", AlbumArtist vaechar(256) ");
            sql.push(", Track Integer ");
            sql.push(", PlayTime vaechar(256) ");
            sql.push(", CurrentTime Double ");
            sql.push(", FrameH Integer ");
            sql.push(", FrameW Integer ");
            sql.push(", FrameRate Integer ");
            sql.push(", DataRate Integer ");
            sql.push(", SampleRate Integer ");
            sql.push(", SampleSize Integer ");
            sql.push(", ChannelCount Integer ");
            sql.push(", StreamNumber Integer ");
            sql.push(", ContentType vaechar(256) ");
            sql.push(", FullPath vaechar(256) ");
            sql.push(", PlayCount Integer ");
            sql.push(", CONSTRAINT PK_T_ITEM PRIMARY KEY(IID) ");
            sql.push(");");
            this.db.run(sql.join(" "));

            sql = ["create table if not exists T_ITEM2GROUP("];
            sql.push("  IID Integer NOT NULL");
            sql.push(", GID Integer NOT NULL");
            sql.push(", CONSTRAINT PK_T_ITEM2GROUP PRIMARY KEY(IID, GID) ");
            sql.push(");");
            this.db.run(sql.join(" "));

            sql = ["create table if not exists T_ITEMLinkITEM("];
            sql.push("  IID Integer NOT NULL");
            sql.push(", LinkedIID Integer NOT NULL");
            sql.push(", CONSTRAINT PK_T_ITEMLinkITEM PRIMARY KEY(IID, LinkedIID) ");
            sql.push(");");
            this.db.run(sql.join(" "), [], () => resolve(true) );



            sql = ["create table if not exists T_ITEM2TAG("];
            sql.push("  IID Integer NOT NULL");
            sql.push(", TAG_ID Integer NOT NULL");
            sql.push(", CONSTRAINT PK_T_ITEM2TAG PRIMARY KEY(IID, TAG_ID) ");
            sql.push(");");
            this.db.run(sql.join(" "), [], () => resolve(true) );


            sql = ["create table if not exists T_ITEM2GENRE("];
            sql.push("  IID Integer NOT NULL");
            sql.push(", GENRE_ID Integer NOT NULL");
            sql.push(", CONSTRAINT PK_T_ITEM2GENRE PRIMARY KEY(IID, GENRE_ID) ");
            sql.push(");");
            this.db.run(sql.join(" "), [], () => resolve(true) );

            sql = ["create table if not exists CK_QUERY_DATA("];
            sql.push("  UID Integer NOT NULL");
            sql.push(", GID Integer NOT NULL");
            sql.push(", Favorite Integer");
            sql.push(", QueryTitle vaechar(256)");
            sql.push(", CONSTRAINT PK_CK_QUERY_DATA PRIMARY KEY(UID, GID) ");
            sql.push(");");
            this.db.run(sql.join(" "), [], () => resolve(true) );

          });
      } catch( err ) {
        log.error('createTblIfNotExit', err);
        resolve(false);
      }
    });
  }

  async doBegin()
  {
    return new Promise((resolve, reject) => {
        this.db.serialize(() => {
            this.db.run("begin;", [],
            (err) => {  if(err) { log.error('doBegin', err); reject(); } else { resolve(undefined); }}
            );
        });
    });
  }

  async doCommit()
  {
    return new Promise((resolve, reject) => {
        this.db.serialize(() => {
            this.db.run("commit;", [],
            (err) => {  if(err) { log.error('doCommit', err); reject(); } else { resolve(undefined); }}
            );
        });
    });
  }

  async doRollback()
  {
    return new Promise((resolve, reject) => {
        this.db.serialize(() => {
            this.db.run("rollback;", [],
            (err) => {  if(err) { log.error('doRollback', err); reject(); } else { resolve(undefined); }}
            );
        });
    });
  }

  //------------------------------------------------------------
  //  T_CONFIG
  //------------------------------------------------------------
  // 設定情報一覧を取得
  async getTConfigs()
  {
      return new Promise<T_CONFIG[]>((resolve, reject) => {
          this.db.all("SELECT * FROM T_CONFIG order by KeyStr;", [], (err, rows:T_CONFIG[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getTConfigs', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  //  設定情報一覧を連想配列で取得
  async getTConfigsAsArray():Promise<{ [key: string]: string }>
  {
      return new Promise<{ [key: string]: string }>((resolve, reject) => {
          this.db.all("SELECT * FROM T_CONFIG order by Key;", [], (err, rows:T_CONFIG[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getTConfigsAsArray',err);
                  reject();
                  return;
              }
              let obj:{ [key: string]: string } = {};
              for(let itm of rows)
              {
                obj[itm.KeyStr] = itm.ValueStr;
              }
              resolve(obj);
          });
      });
  }
  // 設定情報一覧を取得
  async getTConfig(strKey:string) : Promise<string|undefined>
  {
      return new Promise<string|undefined>((resolve, reject) => {
          this.db.get("SELECT * FROM T_CONFIG where KeyStr=?;", [strKey], (err, row:T_CONFIG) => {
              if (err) {
                  // エラー発生時.
                  log.error('getTConfig',err);
                  reject();
                  return;
              }
              if( row == undefined ) {
                resolve(undefined);
              } else {
                resolve(row.ValueStr);
              }
          });
      });
  }
  // 設定情報を追加
  async addTConfig(strKey:string, strValue:string):Promise<string>
  {
    let strIsExistValue:string|undefined = await this.getTConfig(strKey);
    if( strIsExistValue == undefined ) {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into T_CONFIG VALUES(?, ?);", [strKey, strValue],
              (err) => {  if(err) { log.error('addTConfig',err); reject(); } else { resolve(strValue); }}
              );
          });
      });
    } else {
      // 既に存在していれば、更新します。
      await this.updTConfig(strKey, strValue);
      return strIsExistValue;
    }
  }
  // 設定情報を更新
  async updTConfig(strKey:string, strValue:string)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("update T_CONFIG set ValueStr=? where KeyStr=?;", [strValue, strKey],
              (err) => {  if(err) { log.error('updTConfig',err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // 設定情報を削除
  async delTConfig(strKey:string)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_CONFIG where KeyStr=?;", [strKey],
              (err) => {  if(err) { log.error('delTConfig',err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }

  //------------------------------------------------------------
  //  M_STRAGE
  //------------------------------------------------------------
  // ストレージ一覧を取得
  async getStrages()
  {
      return new Promise<M_STRAGE[]>((resolve, reject) => {
          this.db.all("SELECT * FROM M_STRAGE order by SID;", [], (err, rows:M_STRAGE[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getStrages',err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // ストレージ一覧を連想配列で取得
  async getStragesAsArray()
  {
      return new Promise<{ [key: string]: string }>((resolve, reject) => {
          this.db.all("SELECT * FROM M_STRAGE order by SID;", [], (err, rows:M_STRAGE[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getStragesAsArray',err);
                  reject();
                  return;
              }
              let obj:{ [key: string]: string } = {};
              for(let itm of rows)
              {
                obj[itm.SID] = itm.Path;
              }
              resolve(obj);
          });
      });
  }
  // ストレージ一覧を連想配列で、値に、PathのIsExistで取得
  async getStragesAsDeco()
  {
      return new Promise<{ [key: string]: { Path: string; IsExist: boolean; } }>((resolve, reject) => {
          this.db.all("SELECT * FROM M_STRAGE order by SID;", [], (err, rows:M_STRAGE[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getStragesAsDeco',err);
                  reject();
                  return;
              }
              let obj:{ [key: string]: { Path: string; IsExist: boolean; } } = {};
              for(let itm of rows)
              {
                let setData = { "Path": itm.Path, "IsExist":true };
                setData.IsExist = isExistFile( itm.Path );
                obj[itm.SID] = setData;
              }
              resolve(obj);
          });
      });
  }
  // 指定されたSIDのパスを取得
  async getStrageWhereSID(strSID:string) : Promise<string>
  {
    return new Promise<string>((resolve, reject) => {
      this.db.get("SELECT * FROM M_STRAGE where SID=?;", [strSID], (err, row:M_STRAGE) => {
          if (err) {
            // エラー発生時.
            log.error('getStrageWhereSID',err);
            reject();
            return;
          }
          if( row == undefined ) {
            resolve("");
          } else {
            resolve(row.Path);
          }
      });
    });
  }
  // ストレージを追加
  async addStrage(data:M_STRAGE)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into M_STRAGE VALUES(?, ?);", [data.SID, data.Path],
              (err) => {  if(err) { log.error('addStrage',err); reject(); } else { resolve(data.SID); }}
              );
          });
      });
  }
  // ストレージを更新
  async updStrage(data:M_STRAGE)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("update M_STRAGE set Path=? where SID=?;", [data.Path, data.SID],
              (err) => {  if(err) { log.error('updStrage',err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // ストレージを削除
  async delStrage(SID:string)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from M_STRAGE where SID=?;", [SID],
              (err) => {  if(err) { log.error('delStrage', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }


  //------------------------------------------------------------
  //  M_GENRE
  //------------------------------------------------------------
  // ジャンル一覧を取得
  async getGenres()
  {
      return new Promise<M_GENRE[]>((resolve, reject) => {
          this.db.all("SELECT * FROM M_GENRE order by Name;", [], (err, rows:M_GENRE[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGenres', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // ジャンルを取得
  async getGenreByName(name:string)
  {
      name = name.toLowerCase();
      return new Promise<M_GENRE>((resolve, reject) => {
          this.db.get("SELECT * FROM M_GENRE where lower(Name)=?;", [name], (err, row:M_GENRE) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGenreByName', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // ジャンルをIDを指定して取得
  async getGenreByID(GENRE_ID:number)
  {
      return new Promise<M_GENRE>((resolve, reject) => {
          this.db.get("SELECT * FROM M_GENRE where GENRE_ID=?;", [GENRE_ID], (err, row:M_GENRE) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGenreByID', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // 新規の、GENRE_IDを採番します。
  async newGENRE_ID()
  {
      return new Promise<number>((resolve, reject) => {
          this.db.get("SELECT MAX(GENRE_ID) AS id FROM M_GENRE;", [], (err, row:{id:number}) => {
              if (err) {
                  // エラー発生時.
                  log.error('newGENRE_ID', err);
                  reject();
                  return;
              }
              resolve(row.id+1);
          });
      });
  }
  // ジャンルを追加
  async addGenre(name:string): Promise<number>
  {
      let GENRE_ID = -1;
      // 既にジャンルが登録されていないかチェックします。
      let exitData = await this.getGenreByName( name );
      if( exitData == undefined )
      {
          // 新規の、GENRE_IDを採番します。
          GENRE_ID = await this.newGENRE_ID();
          return new Promise((resolve, reject) => {
              this.db.serialize(() => {
                  this.db.run("insert into M_GENRE VALUES(?, ?);", [GENRE_ID, name],
                  (err) => {  if(err) { log.error('addGenre', err); reject(); } else { resolve(GENRE_ID); }}
                  );
              });
          });
      } else {
          return exitData.GENRE_ID;
      }
  }
  // ジャンルを更新
  async updGenre(GENRE_ID:number, name:string)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("update M_GENRE set Name=? where GENRE_ID=?;", [name, GENRE_ID],
              (err) => {  if(err) { log.error('updGenre', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // ジャンルを削除
  async delGenre(GENRE_ID:number)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from M_GENRE where GENRE_ID=?;", [GENRE_ID],
              (err) => {  if(err) { log.error('delGenre', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }


  //------------------------------------------------------------
  //  M_TAG
  //------------------------------------------------------------
  // タグ一覧を取得
  async getTags()
  {
      return new Promise<M_TAG[]>((resolve, reject) => {
          this.db.all("SELECT * FROM M_TAG order by Name;", [], (err, rows:M_TAG[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getTags', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // 名前を指定して、タグを取得
  async getTagByName(name:string) : Promise<M_TAG>
  {
      name = name.toLowerCase();
      return new Promise<M_TAG>((resolve, reject) => {
          this.db.get("SELECT * FROM M_TAG where lower(Name)=?;", [name], (err, row:M_TAG) => {
              if (err) {
                  // エラー発生時.
                  log.error('getTagByName', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // 名前を指定して、タグを取得
  async getTagByID(TAG_ID:number) : Promise<M_TAG>
  {
      return new Promise<M_TAG>((resolve, reject) => {
          this.db.get("SELECT * FROM M_TAG where TAG_ID=?;", [TAG_ID], (err, row:M_TAG) => {
              if (err) {
                  // エラー発生時.
                  log.error('getTagByID', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // 新規の、TAG_IDを採番します。
  async newTAG_ID()
  {
      return new Promise<number>((resolve, reject) => {
          this.db.get("SELECT MAX(TAG_ID) AS id FROM M_TAG;", [], (err, row:{id:number}) => {
              if (err) {
                  // エラー発生時.
                  log.error('newTAG_ID', err);
                  reject();
                  return;
              }
              resolve(row.id+1);
          });
      });
  }
  // タグを追加
  async addTag(name:string) : Promise<number>
  {
      let TAG_ID = -1;
      // 既にジャンルが登録されていないかチェックします。
      let exitData = await this.getTagByName( name );
      if( exitData == undefined )
      {
          //新規の、TAG_IDを採番します。
          TAG_ID = await this.newTAG_ID();
          return new Promise((resolve, reject) => {
              this.db.serialize(() => {
                  this.db.run("insert into M_TAG VALUES(?, ?);", [TAG_ID, name],
                  (err) => {  if(err) { log.error('addTag', err); reject(); } else { resolve(TAG_ID); }}
                  );
              });
          });
      } else {
          return exitData.TAG_ID;
      }
  }
  // タグを更新
  async updTag(TAG_ID:number, name:string)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("update M_TAG set Name=? where TAG_ID=?;", [name, TAG_ID],
              (err) => {  if(err) { log.error('updTag', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // タグを削除
  async delTag(TAG_ID:number)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from M_TAG where TAG_ID=?;", [TAG_ID],
              (err) => {  if(err) { log.error('delTag', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }


  //------------------------------------------------------------
  //  T_DATA_BASE
  //------------------------------------------------------------
  async newDID()
  {
      return new Promise<number>((resolve, reject) => {

          this.db.get("SELECT MAX(DID) AS id FROM T_DATA_BASE;", [], (err, row:{id:number}) => {
              if (err) {
                  // エラー発生時.
                  log.error("newDID", err);
                  reject();
                  return;
              }
              if( row == undefined )
              {
                resolve(0);
                return ;
              }
              resolve(row.id+1);
          });
      });
  }





  //------------------------------------------------------------
  //  T_GROUP
  //    GID	グループID	Int		N	Y
  //    PARENT_GID	親グループID	Int		N
  //    DirName	ディレクトリ名	vaechar	256	N
  //    Name	名前	vaechar	256	N
  //    SearchName	ローカル名	vaechar	256	Y
  //    Favorite	お気に入り	Int		N		0-1
  //    Kind	種類	Int				0:Image/1:Music/2:Video
  //    SubKind	分類2	Int				0:Artist/2:Alubam
  //    ArtWork	ローカル名	vaechar	256	Y
  //    Comment	ローカル名	vaechar	256	Y
  //    ConfigJson	config.jsonの内容	vaechar	256
  //    DelMark	削除マーク	Int
  //    LatestCheck	確認日時	vaechar	256
  //------------------------------------------------------------
  // T_GROUPのGIDを新規に採番します。
  async newGID()
  {
      return await this.newDID();
  }
  // 指定した名前のグループを取得。親グループの有無は、無視します。
  async getGroupByName( Name:string) : Promise<T_GROUP>
  {
      Name = Name.toLowerCase();
      return new Promise<T_GROUP>((resolve, reject) => {
          let sql = ['select B.*,G.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_GROUP AS G');
          sql.push('    ON B.DID = G.GID');
          sql.push(' where  lower(B.Name) = ?');
          sql.push(';');
          this.db.get(sql.join(" "), [Name], (err, row:T_GROUP) => {
              if (err) {
                  // エラー発生時.
                  log.error("getGroupByName", err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // 指定した名前のグループを取得。親グループの有無は、無視します。
  async getGroupByDirName( DirName:string) : Promise<T_GROUP>
  {
      DirName = DirName.toLowerCase();
      return new Promise<T_GROUP>((resolve, reject) => {
          let sql = ['select B.*,G.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_GROUP AS G');
          sql.push('    ON B.DID = G.GID');
          sql.push(' where  lower(G.DirName) = ?');
          sql.push(';');
          this.db.get(sql.join(" "), [DirName], (err, row:T_GROUP) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroupByDirName', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // 指定した名前のグループを取得
  async getGroupByNameWithParent( Name:string, PARENT_GID:number) : Promise<T_GROUP>
  {
      Name = Name.toLowerCase();
      return new Promise<T_GROUP>((resolve, reject) => {
        let sql = ['select B.*,G.*'];
        sql.push('from T_DATA_BASE AS B');
        sql.push('  inner join T_GROUP AS G');
        sql.push('    ON B.DID = G.GID');
        sql.push(' where  lower(B.Name) = ?');
        sql.push(' and    B.PARENT_GID = ?');
        sql.push(';');
          this.db.get(sql.join(" "), [Name, PARENT_GID], (err, row:T_GROUP) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroupByNameWithParent', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }

  // 指定した名前のグループを取得
  async getGroupByDirNameWithParent( DirName:string, PARENT_GID:number) : Promise<T_GROUP>
  {
      DirName = DirName.toLowerCase();
      return new Promise<T_GROUP>((resolve, reject) => {
        let sql = ['select B.*,G.*'];
        sql.push('from T_DATA_BASE AS B');
        sql.push('  inner join T_GROUP AS G');
        sql.push('    ON B.DID = G.GID');
        sql.push(' where  lower(G.DirName) = ?');
        sql.push(' and    B.PARENT_GID = ?');
        sql.push(';');
          this.db.get(sql.join(" "), [DirName, PARENT_GID], (err, row:T_GROUP) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroupByDirNameWithParent', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }

  // 指定した名前のグループを取得
  async getGroupByNameFuzzy( Name:string )
  {
      Name = Name.toLowerCase();
      return new Promise<T_GROUP>((resolve, reject) => {
          let sql = ['select B.*,G.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_GROUP AS G');
          sql.push('    ON B.DID = G.GID');
          sql.push(' where  lower(B.Name) = ?');
          sql.push(' or     lower(G.DirName) = ?');
          sql.push(';');
          this.db.get(sql.join(" "), [Name,Name], (err, row:T_GROUP) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroupByNameFuzzy', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // 指定したGIDのグループを取得
  async getGroupByGID(GID:number):Promise<T_GROUP>
  {
      return new Promise<T_GROUP>((resolve, reject) => {
          let sql = ['select B.*,G.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_GROUP AS G');
          sql.push('    ON B.DID = G.GID');
          sql.push(' where  G.GID = ?');
          sql.push('order By G.SearchName');
          sql.push(';');
          this.db.get(sql.join(" "), [GID], (err, row:T_GROUP) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroupByGID', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }


  // 指定したGIDのグループを取得
  async getClsGroupCollect(grp:ImpleGroup)
  {
    // 指定グループ直下のサブグループ一覧を取得
    let GIDs:number[] = [];
    let subGroups = await this.getGroups(grp.GID);
    for(let subBroup of subGroups)
    {
        let setSubGrp = new ImpleGroup(subBroup.DirName, subBroup.Name, subBroup.SearchName);
        setSubGrp.GID = subBroup.GID;
        setSubGrp.PARENT_GID = subBroup.PARENT_GID;
        setSubGrp.Favorite = subBroup.Favorite;
        setSubGrp.Kind = subBroup.Kind;
        setSubGrp.SubKind = subBroup.SubKind;
        setSubGrp.ArtWork = subBroup.ArtWork;
        setSubGrp.Comment = subBroup.Comment;
        setSubGrp.ConfigJson = subBroup.ConfigJson;
        setSubGrp.DelMark = subBroup.DelMark;
        setSubGrp.LatestCheck = subBroup.LatestCheck;


        GIDs.push(subBroup.GID);
        grp.subgroupsArray.push( setSubGrp );
    }
    // サブグループ直下のストレージ一覧
    let strages = await this.getGroup2StragesInGIDs(GIDs);
    for(let strg of strages)
    {
      for(let subGrp of grp.subgroupsArray)
      {
        if( subGrp.GID == strg.GID) {
          subGrp.strages[strg.SID] = strg.Path;
          break;
        }
      }
    }
  }
  // 指定したGIDのグループを取得
  async getClsRootGroup():Promise<ImpleGroup|undefined>
  {
    let grp:ImpleGroup = new ImpleGroup("", "", "");

    grp.GID = -1;
    grp.PARENT_GID = -1;
    // グループが属するストレージ一覧
    grp.strages = await this.getStragesAsArray();
    grp.LatestCheck = "Non";
    // グループのその他情報を収集します。
    await this.getClsGroupCollect(grp);

    return grp;
  }


  // 指定したGIDのグループを取得
  async getClsGroupByGID(GID:number):Promise<ImpleGroup|undefined>
  {
    let agroup = await this.getGroupByGID(GID);
    if( agroup == undefined )
    {
      log.warn(`GID:${GID} is not found.`);
      return undefined;
    }
    let grp:ImpleGroup = new ImpleGroup(agroup.DirName, agroup.Name, agroup.SearchName);
    grp.GID = agroup.GID;
    grp.PARENT_GID = agroup.PARENT_GID;
    grp.Favorite = agroup.Favorite;
    grp.Kind = agroup.Kind;
    grp.SubKind = agroup.SubKind;
    grp.ArtWork = agroup.ArtWork;
    grp.Comment = agroup.Comment;
    grp.ConfigJson = agroup.ConfigJson;
    grp.DelMark = agroup.DelMark;
    grp.LatestCheck = agroup.LatestCheck;


    // グループが属するストレージ一覧
    grp.strages = await this.getGroup2StragesAsArray(GID);

    // グループ間の関連グループ名一覧を取得します。
    grp.sameGrps = undefined;
    let grelation = await this.getGRelationGNames(GID);
    if( grelation != undefined )
    {
      if( grelation.length != 0 )
      {
        grp.sameGrps = grelation;
      }
    }

    // グループのその他情報を収集します。
    await this.getClsGroupCollect(grp);

    return grp;
  }
  // T_GROUPのGIDを新規に採番します。
  async getGroups(PARENT_GID:number):Promise<T_GROUP[]>
  {
      return new Promise<T_GROUP[]>((resolve, reject) => {
          let sql = ['select B.*,G.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_GROUP AS G');
          sql.push('    ON B.DID = G.GID');
          sql.push(' where  B.PARENT_GID = ?');
          sql.push('order By G.SearchName');
          sql.push(';');
          this.db.all(sql.join(" "), [
              PARENT_GID == undefined ? -1 : PARENT_GID
          ], (err, rows:T_GROUP[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroups', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // T_GROUPのGIDを新規に採番します。
  async getGroupsSimple(PARENT_GID:number):Promise<ImpleIdName[]>
  {
      return new Promise<ImpleIdName[]>((resolve, reject) => {
          let sql = ['select B.DID as id,B.Name as name'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_GROUP AS G');
          sql.push('    ON B.DID = G.GID');
          sql.push(' where  B.PARENT_GID = ?');
          sql.push('order By G.SearchName');
          sql.push(';');
          this.db.all(sql.join(" "), [
              PARENT_GID == undefined ? -1 : PARENT_GID
          ], (err, rows:ImpleIdName[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroups', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // グループを追加します。
  async addGroup(  data:{ [key: string]: any }
    , bIntegrateGroup:boolean
    , bIsMaster:boolean  ) : Promise<number>
  {
      let GID = -1;
      // 既にグループ登録されていないかチェックします。
      let exitData = undefined;
      if( bIntegrateGroup == true )
      {
        exitData = await this.getGroupByDirName( data.DirName );
      }
      else
      {
        exitData = await this.getGroupByDirNameWithParent( data.DirName, data.PARENT_GID );
      }
      if( exitData == undefined )
      {
          // 新規の、GIDを採番します。
          GID = await this.newGID();
          return new Promise<number>((resolve, reject) => {
              this.db.serialize(() => {
                  this.db.run("insert into T_DATA_BASE VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);",
                        [
                            GID,
                            data.PARENT_GID == undefined ? -1 : data.PARENT_GID,
                            0,
                            data.Name,
                            data.Comment,
                            data.Favorite,
                            data.ArtWork,
                            data.DelMark,
                            undefined,
                          ],
                        (err) => {  if(err) { log.error("addGroup", err); reject(); } }
                  );
                  this.db.run("insert into T_GROUP VALUES(?, ?, ?, ?, ?, ?);",
                      [
                          GID,
                          data.DirName,
                          data.SearchName,
                          data.Kind,
                          data.SubKind,
                          data.ConfigJson
                        ],
                      (err) => {  if(err) { log.error("addGroup", err); reject(); } }
                  );
                  resolve(GID);
              });
          });
      } else {
        // 既に存在する場合は、更新します。
        if( data.GID != undefined )
        {
          delete data.GID;
        }
        if( bIsMaster == false ) {
          // マスターでなければ、
          // 親IDは変更しないので、あれば、配列から削除します。
          if( data.PARENT_GID != undefined )
          {
            delete data.PARENT_GID;
          }
          // donfig.jsonもMasterだけする。
          if( data.ConfigJson != undefined )
          {
            delete data.ConfigJson;
          }
        }
        await this.updGroup(exitData.GID, data);
        return exitData.GID;
      }
  }
  // グループ情報を更新します。
  async updGroup( GID:number, data:{ [key: string]: any } )
  {
      let setDB:{ [key: string]: any }  = {};
      let setDG:{ [key: string]: any }  = {};

      for(let key of Object.keys(data) )
      {
        if( key == "PARENT_GID" ||
            key == "BaseType" ||
            key == "Name" ||
            key == "Comment" ||
            key == "Favorite" ||
            key == "ArtWork" ||
            key == "DelMark" ||
            key == "LatestCheck"  )
          {
            setDB[key] = data[key];
          }
          else
          {
            setDG[key] = data[key];
          }
      }


      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
            if( Object.keys(setDB).length != 0 )
            {
              let setD:any[] = [];
              let sql = ["update T_DATA_BASE set "];
              for(let key of Object.keys(setDB) )
              {
                if( setD.length != 0 ) {
                  sql.push(", ");
                }
                sql.push(key);
                sql.push("=?");
                setD.push(setDB[key]);
              }
              sql.push(" where DID=?;");
              setD.push( GID );

              this.db.run(sql.join(' '), setD,
                    (err) => {  if(err) { log.error("updGroup", err); reject(); } }
                );
            }
            if( Object.keys(setDG).length != 0 )
            {
              let setD:any[] = [];
              let sql = ["update T_GROUP set "];
              for(let key of Object.keys(setDG) )
              {
                if( setD.length != 0 ) {
                  sql.push(", ");
                }
                sql.push(key);
                sql.push("=?");
                setD.push(setDG[key]);
              }
              sql.push(" where GID=?;");
              setD.push( GID );

              this.db.run(sql.join(' '), setD,
                    (err) => {  if(err) { log.error("updGroup", err); reject(); } }
                );
            }

            resolve(undefined);
          });
      });
  }
  // グループ情報を更新します。
  async delGroup( GID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {

              this.db.run("delete from T_ITEM2GROUP where GID=?;", [GID],
              (err) => {  if(err) { log.error('delGroup', err); reject(); } }
              );
              this.db.run("delete from T_GROUP2STRAGE where GID=?;", [GID],
              (err) => {  if(err) { log.error('delGroup', err); reject(); }}
              );
              this.db.run("delete from T_GRELATION where GID=?;", [GID],
              (err) => {  if(err) { log.error('delGroup', err); reject(); }}
              );
              this.db.run("delete from T_GRELATION where RELATION_GID=?;", [GID],
              (err) => {  if(err) { log.error('delGroup', err); reject(); }}
              );
              this.db.run("delete from T_GROUP where GID=?;", [GID],
              (err) => {  if(err) { log.error('delGroup', err); reject(); }}
              );
              this.db.run("delete from T_DATA_BASE where DID=?;", [GID],
              (err) => {  if(err) { log.error('delGroup', err); reject(); }}
              );

              resolve(undefined);
          });
      });
  }
  // 更新日時を更新します。
  async updGroupAtLatestCheck( GID:number )
  {
    return this.updGroup(GID, {"LatestCheck":getDateTime2String(new Date())});
  }



  //------------------------------------------------------------
  //  T_GRELATION
  //      GID	グループID	Int		N	Y
  //      RELATION_GID	関連グループID	Int		N	Y
  //------------------------------------------------------------
  // 指定したGIDの関連GID一覧を取得
  async getGRelationGids( GID:number )
  {
      return new Promise<T_GRELATION[]>((resolve, reject) => {
          this.db.all("SELECT RELATION_GID FROM T_GRELATION where GID = ?;", [GID], (err, rows:T_GRELATION[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGRelationGids', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // 指定したGIDの関連GID一覧を取得
  async getGRelationGNames( GID:number )
  {
      return new Promise<ImpleIdName[]>((resolve, reject) => {
          this.db.all("SELECT T_GRELATION.RELATION_GID as id, T_DATA_BASE.Name as name FROM T_GRELATION inner join T_DATA_BASE ON T_GRELATION.RELATION_GID = T_DATA_BASE.DID   where T_GRELATION.GID = ?;", [GID], (err, rows:ImpleIdName[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGRelationGids', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // グループ間の紐づけを登録します。
  async addGRelation( GID:number, RELATION_GID:number )
  {
      let relation_gids = await this.getGRelationGids(GID);
      if( relation_gids != undefined )
      {
          for(let relation_gid of relation_gids)
          {
              if( relation_gid.RELATION_GID == RELATION_GID )
              {
                  log.error("already exit RELATION_GID(" +  RELATION_GID + ") in " + GID );
                  return ;
              }
          }
      }

      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into T_GRELATION VALUES(?, ?);",
                  [GID, RELATION_GID],
                  (err) => {  if(err) { log.error('addGRelation', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // グループ間の紐づけを削除します。
  async delGRelation( GID:number, RELATION_GID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_GRELATION where GID=? AND RELATION_GID=?;", [GID, RELATION_GID],
              (err) => {  if(err) { log.error('delGRelation', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // グループ間の紐づけを削除します。
  async delGRelationByGid( GID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_GRELATION where GID=?;", [GID],
              (err) => {  if(err) { log.error('delGRelationByGid', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // グループ間の紐づけを更新します。
  async updGRelation( GID:number , relationGids:number[])
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {

              this.db.run("delete from T_GRELATION where GID=?;", [GID],
                (err) => {  if(err) { log.error('delGRelationByGid', err); reject(); } }
              );

              for(let relationGid of relationGids )
              {
                  this.db.run("insert into T_GRELATION VALUES(?, ?);", [GID, relationGid],
                    (err) => {  if(err) { log.error('delGRelationByGid', err); reject(); } }
                  );
              }
              resolve(undefined);
          });
      });
  }

  //------------------------------------------------------------
  //  T_GROUP2STRAGE
  //      GID	グループID	Int		N	Y
  //      SID	ストレージID	vaechar	256	N	Y
  //      Path	パス	vaechar	256	N
  //------------------------------------------------------------
  // 指定したGIDのグループのあるストレージ一覧を取得
  async getGroup2Strages( GID:number )
  {
      return new Promise<T_GROUP2STRAGE[]>((resolve, reject) => {
          this.db.all("SELECT SID,Path FROM T_GROUP2STRAGE where GID = ?;", [GID], (err, rows:T_GROUP2STRAGE[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroup2Strages', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  async getGroup2StragesInGIDs( GIDs:number[] )
  {
      let strGIDs:string = GIDs.join(',');
      let strSQL = "SELECT * FROM T_GROUP2STRAGE where GID in ("
      strSQL += strGIDs;
      strSQL += ") order by GID;"
      return new Promise<T_GROUP2STRAGE[]>((resolve, reject) => {
          this.db.all(strSQL, [], (err, rows:T_GROUP2STRAGE[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroup2StragesInGIDs', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }


  // 指定したGIDのグループのあるストレージ一覧を連想配列取得
  async getGroup2StragesAsArray( GID:number ) : Promise<{ [key: string]: string; }>
  {
      return new Promise<{ [key: string]: string }>((resolve, reject) => {
          this.db.all("SELECT SID,Path FROM T_GROUP2STRAGE where GID = ?;", [GID], (err, rows:T_GROUP2STRAGE[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getGroup2StragesAsArray', err);
                  reject();
                  return;
              }
              let obj:{ [key: string]: string } = {};
              for(let row of rows)
              {
                  obj[row.SID] = row.Path;
              }
              resolve(obj);
          });
      });
  }
  // グループのあるストレージを登録します。
  async addGroup2Strage( GID:number, SID:string, Path:string )
  {
      let g2s = await this.getGroup2Strages(GID);
      if( g2s != undefined )
      {
          for(let g2 of g2s)
          {
              if( g2.SID == SID )
              {
                  //log.error("already exit SID(" +  SID + ") in " + GID );
                  return ;
              }
          }
      }

      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into T_GROUP2STRAGE VALUES(?, ?, ?);",
                  [GID, SID, Path],
                  (err) => {  if(err) { log.error('addGroup2Strage', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // グループのあるストレージを削除します。
  async delGroup2Strage( GID:number, SID:string )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_GROUP2STRAGE where GID=? AND SID=?;", [GID, SID],
              (err) => {  if(err) { log.error('delGroup2Strage', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // グループのあるストレージを削除します。
  async delGroup2StrageByGid( GID:number  )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_GROUP2STRAGE where GID=?;", [GID],
              (err) => {  if(err) { log.error('delGroup2StrageByGid', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }

  //------------------------------------------------------------
  //  T_ITEM2GROUP
  //      IID	アイテムID	Int		N	Y
  //      GID	グループID	Int		N	Y
  //------------------------------------------------------------
  // アイテムに参加しているグループ一覧を取得
  async getItem2Gids( IID:number ):Promise<T_ITEM2GROUP[]>
  {
      return new Promise<T_ITEM2GROUP[]>((resolve, reject) => {
          this.db.all("SELECT GID FROM T_ITEM2GROUP where IID = ?;", [IID], (err, rows:T_ITEM2GROUP[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItem2Gids', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // アイテムに参加しているグループを登録します。
  async addItem2Gid( IID:number, GID:number )
  {
      let gids = await this.getItem2Gids(IID);
      if( gids != undefined )
      {
          for(let gid of gids)
          {
              if( gid.GID == GID )
              {
                  log.error("already exit T_ITEM2GROUP(" +  GID + ") in " + IID );
                  return ;
              }
          }
      }

      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into T_ITEM2GROUP VALUES(?, ?);",
                  [IID, GID],
                  (err) => {  if(err) { log.error('addItem2Gid', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムに参加しているグループを削除します。
  async delItem2Gid( IID:number, GID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEM2GROUP where IID=? AND GID=?;", [IID, GID],
              (err) => {  if(err) { log.error('delItem2Gid', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムに参加しているグループを削除します。
  async delItem2GidByIID( IID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEM2GROUP where IID=?;", [IID],
              (err) => {  if(err) { log.error('delItem2GidByIID', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムに参加しているグループを削除します。
  async delItem2GidByGID( GID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEM2GROUP where GID=?;", [GID],
              (err) => {  if(err) { log.error('delItem2GidByGID', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }

  //------------------------------------------------------------
  //  T_ITEMLinkITEM
  //      IID	アイテムID	Int		N	Y
  //      LinkedIID	リンクしているアイテムID	Int		N	Y
  //------------------------------------------------------------
  // アイテムにリンクしているアイテム一覧を取得
  async getItemLinkedItems( IID:number )
  {
      return new Promise<T_ITEMLinkITEM[]>((resolve, reject) => {
          this.db.all("SELECT LinkedIID FROM T_ITEMLinkITEM where IID = ?;", [IID], (err, rows:T_ITEMLinkITEM[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemLinkedItems', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // アイテムにリンクしているアイテムを登録します。
  async addItemLinkedItem( IID:number, LinkedIID:number )
  {
      let linkedIIDs = await this.getItemLinkedItems(IID);
      if( linkedIIDs != undefined )
      {
          for(let linkedIID of linkedIIDs)
          {
              if( linkedIID.LinkedIID == LinkedIID )
              {
                  log.error("already exit T_ITEMLinkITEM(" +  LinkedIID + ") in " + IID );
                  return ;
              }
          }
      }

      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into T_ITEMLinkITEM VALUES(?, ?);",
                  [IID, LinkedIID],
                  (err) => {  if(err) { log.error('addItemLinkedItem', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムにリンクしているアイテムを削除します。
  async delItemLinkedItem( IID:number, LinkedIID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEMLinkITEM where IID=? AND LinkedIID=?;", [IID, LinkedIID],
              (err) => {  if(err) { log.error('delItemLinkedItem', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムにリンクしているアイテムを削除します。
  async delItemLinkedItemByIID( IID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEMLinkITEM where IID=?;", [IID],
              (err) => {  if(err) { log.error('delItemLinkedItemByIID', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }

  //------------------------------------------------------------
  //  T_ITEM
  //      IID	アイテムID	Int		N	Y
  //      PARENT_GID	親グループID	Int		N
  //      SID	ストレージID	vaechar	256	N
  //      Name	名前	vaechar	256	N
  //      Code	コード	vaechar	256	Y
  //      Ext	拡張子	vaechar	256	N
  //      LinkIID	リンクアイテムID	Int		N		0-N
  //      Favorite	評価	Int		N		0-100
  //      Year	年	Int		Y
  //      Comment	コメント	vaechar	256	Y
  //      Title	タイトル	vaechar	256	Y
  //      SubTitle	サブタイトル	vaechar	256	Y
  //      AlbumArtist	アルバムアーティスト	vaechar	256	Y
  //      Track	トラック	Int		Y
  //      PlayTime	時間	vaechar	256	Y
  //      CurrentTime 現在の再生時刻	double
  //      FrameH	フレーム高	Int		Y
  //      FrameW	フレーム幅	Int		Y
  //      FrameRate	レート	Int		Y
  //      DataRate	データレート	Int		Y
  //      SampleRate	サンプルレート	Int		Y
  //      SampleSize	サンプルサイズ	Int		Y
  //      ChannelCount	チャンネルカウント	Int		Y
  //      StreamNumber	ストリームNo	Int		Y
  //      ContentType	コンテントタイプ(MIME)	vaechar	256	Y
  //      FullPath	フルパス	vaechar	256	Y
  //      ArtWork	サムネイル画像情報	vaechar	256	Y
  //      PlayCount	再生回数	Int
  //      DelMark	削除マーク	Int
  //      LatestCheck	確認日時	vaechar	256	Y
  //------------------------------------------------------------
  // ITEMのIIDを新規に採番します。
   async newIID()
  {
      return await this.newDID();
  }
  // 指定した名前のアイテムを取得
  async getItemByName( GID:number, Name:string )
  {
      return new Promise<T_ITEM>((resolve, reject) => {
          let sql = ['select B.*,I.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push(' where  lower(B.Name) = ?');
          sql.push(' and  B.PARENT_GID = ?');
          sql.push(';');
          Name = Name.toLowerCase();
          this.db.get(sql.join(" "), [Name, GID], (err, row:T_ITEM) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemByName', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // 指定した名前のアイテムを取得
  async getItemByIID( IID:number ) : Promise<T_ITEM>
  {
      return new Promise<T_ITEM>((resolve, reject) => {
          let sql = ['select B.*,I.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push(' where  I.IID = ?');
          sql.push(';');
          this.db.get(sql.join(" "), [IID], (err, row:T_ITEM) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemByIID', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  async getClsItemByIID( IID:number ) : Promise<ImpleFile|undefined>
  {
    let itm = await this.getItemByIID(IID);
    if( itm == undefined )
    {
      return undefined;
    }
    let item:ImpleFile = await this.convItemTBL3Cls(itm, null);//new ImpleFile(null, "", "");

    // アイテムに参加しているグループ
    let item2grps = await this.getItem2Gids(item.IID);
    if( item2grps != undefined )
    {
      if( item2grps.length != 0 ) {

        item.artists = [];
        for(let itm of item2grps )
        {
          let grp = await this.getGroupByGID(itm.GID);
          if( grp != undefined )
          {
            item.artists.push({id:grp.GID, name:grp.Name});
          }
        }
      }
      // アイテムに関連付けられたジャンル
      let itm2gemres = await this.getItem2Genres_IncName(itm.IID);
      if( itm2gemres != undefined )
      {
        if( itm2gemres.length != 0 ) {
          item.genres = itm2gemres;
        }
      }
      // アイテムに関連付けられたタグ
      let itm2tags = await this.getItem2Tags_IncName(itm.IID);
      if( itm2tags != undefined )
      {
        if( itm2tags.length != 0 ) {
          item.tags = itm2tags;
        }
      }
    }

    return item;
  }
  // 指定したグループに紐づくアイテムの一覧を取得します。
  async getItemsAtGID(GID:number) : Promise<T_ITEM[]>
  {
      return new Promise<T_ITEM[]>((resolve, reject) => {
          let sql = ['select B.*,I.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push(' where  B.PARENT_GID = ?');
          sql.push(' order by B.Name');
          sql.push(';');
          this.db.all(sql.join(" "), [GID], (err, rows:T_ITEM[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemsAtGID', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }

  // 指定した名前に一致するアイテム一覧を取得
  async getItemsAtName(name:string) : Promise<T_ITEM[]>
  {
      return new Promise<T_ITEM[]>((resolve, reject) => {
          let sql = ['select B.*,I.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push(' where  B.Name = ?');
          sql.push(';');
          this.db.all(sql.join(" "), [name], (err, rows:T_ITEM[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemsAtName', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }

  // 指定した名前に一致するアイテム一覧を取得
  async getItemsAtCode(code:string) : Promise<T_ITEM[]>
  {
      return new Promise<T_ITEM[]>((resolve, reject) => {
          let sql = ['select B.*,I.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push(' where  I.Code = ?');
          sql.push(';');
          this.db.all(sql.join(" "), [code], (err, rows:T_ITEM[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemsAtCode', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }


  // 指定したグループに紐づくアイテムの一覧を取得します。
  async getItemsAtILinkdIIDs(linkedIIDs:number[]) : Promise<T_ITEM[]>
  {
    return new Promise<T_ITEM[]>((resolve, reject) => {
          let sql = ['select B.*,I.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push(' where  I.LinkIID in (?)');
          sql.push(' order by B.Name');
          sql.push(';');
          this.db.all(sql.join(" "), [linkedIIDs.join(", ")], (err, rows:T_ITEM[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemsAtILinkdIIDs', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // Where句に自由に指定して、アイテム一覧を取得します。
  async getItemsSpWhere(strWhere:string, opts:any) : Promise<T_ITEM[]>
  {
      return new Promise<T_ITEM[]>((resolve, reject) => {
            let sql = ['select B.*,I.*'];
            sql.push('from T_DATA_BASE AS B');
            sql.push('  inner join T_ITEM AS I');
            sql.push('    ON B.DID = I.IID ');
            this.db.all(sql.join(" ") + strWhere + ";", opts, (err, rows:T_ITEM[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemsSpWhere', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // 指定したジャンルに紐づくアイテムの一覧を取得します。
  async getItemsWhereGenre(GENRE_ID:number
          , iPageLimit:number // 取得する最大レコード数
          , iPageOffset:number  // 取得を開始する位置。０～
  ) : Promise<T_ITEM[]>
  {
      return new Promise<T_ITEM[]>((resolve, reject) => {
          /*
              select A.*
              from T_ITEM as A
                inner join T_ITEM2GENRE as B
                on A.IID = B.IID
                where B.GENRE_ID=?
                and A.DelMark = 0
                LIMIT ? OFFSET ?
          */
          let sql = ['select B.*,I.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  inner join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push('  inner join T_ITEM2GENRE AS GE');
          sql.push('    ON GE.IID = I.IID');
          sql.push(' where  GE.GENRE_ID = ?');
          sql.push(' LIMIT ? OFFSET ?');
          sql.push(';');
          this.db.all(sql.join(" ")
          , [GENRE_ID, iPageLimit, iPageOffset], (err, rows:T_ITEM[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItemsWhereGenre', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // 指定したジャンルに紐づくアイテム数を取得します。
  async getItemCountWhereGenreID(GENRE_ID:number):Promise<number>
  {
    return new Promise<number>((resolve, reject) => {
            /*
              select count(A.IID) as countOfid
              from T_ITEM as A  inner join T_ITEM2GENRE as B
                on A.IID = B.IID
              where B.GENRE_ID=?
              and A.DelMark = 0 ;


            */
            let sql = ['select count(I.IID) as countOfid '];
            sql.push('from T_DATA_BASE AS B');
            sql.push('  inner join T_ITEM AS I');
            sql.push('    ON B.DID = I.IID');
            sql.push('  inner join T_ITEM2GENRE AS GE');
            sql.push('    ON GE.IID = I.IID');
            sql.push(' where  GE.GENRE_ID = ?');
            sql.push(';');

            this.db.get( sql.join(" ") , [GENRE_ID], (err, row:any) => {
            if (err) {
                // エラー発生時.
                log.error('getItemCountWhereGenreID', err);
                reject();
                return;
            }
            resolve(row.countOfid);
        });
    });
  }
  // 指定したジャンルに紐づくアイテムの一覧を取得します。
  async getItemsWhereTag(TAG_ID:number
      , iPageLimit:number // 取得する最大レコード数
      , iPageOffset:number  // 取得を開始する位置。０～
  ) : Promise<T_ITEM[]>
  {
    return new Promise<T_ITEM[]>((resolve, reject) => {
        let sql = ['select B.*,I.*'];
        sql.push('from T_DATA_BASE AS B');
        sql.push('  inner join T_ITEM AS I');
        sql.push('    ON B.DID = I.IID');
        sql.push('  inner join T_ITEM2TAG AS TE');
        sql.push('    ON TE.IID = I.IID');
        sql.push(' where  TE.TAG_ID = ?');
        sql.push(' LIMIT ? OFFSET ?');
        sql.push(';');
        this.db.all( sql.join(" ")
        , [TAG_ID, iPageLimit, iPageOffset], (err, rows:T_ITEM[]) => {
            if (err) {
                // エラー発生時.
                log.error('getItemsWhereTag', err);
                reject();
                return;
            }
            resolve(rows);
        });
    });
  }
  // 指定したタグに紐づくアイテム数を取得します。
  async getItemCountWhereTagID(TAG_ID:number):Promise<number>
  {
    return new Promise<number>((resolve, reject) => {
        let sql = ['select count(I.IID) as countOfid '];
        sql.push('from T_DATA_BASE AS B');
        sql.push('  inner join T_ITEM AS I');
        sql.push('    ON B.DID = I.IID');
        sql.push('  inner join T_ITEM2TAG AS TE');
        sql.push('    ON TE.IID = I.IID');
        sql.push(' where  TE.TAG_ID = ?');
        sql.push(';');
        this.db.get( sql.join(" ")
            , [TAG_ID], (err, row:any) => {
            if (err) {
                // エラー発生時.
                log.error('getItemCountWhereTagID', err);
                reject();
                return;
            }
            resolve(row.countOfid);
        });
    });
  }
  // アイテムを追加します。
  async addItem( data:{ [key: string]: any } ):Promise<number>
  {
    try {
      let IID = -1;

      data.DelMark = 0; // 削除マークは、0=削除していないにセットします。

      // 既にアイテムが登録されていないかチェックします。
      let exitData = await this.getItemByName( data.PARENT_GID== undefined ? -1 : data.PARENT_GID, data.Name );
      if( exitData == undefined )
      {
          // 新規の、GIDを採番します。
          IID = await this.newIID();
          return new Promise<number>((resolve, reject) => {
              this.db.serialize(() => {

                  this.db.run("insert into T_DATA_BASE VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);",
                              [
                                IID,
                                  data.PARENT_GID == undefined ? -1 : data.PARENT_GID,
                                  1,
                                  data.Name,
                                  data.Comment,
                                  data.Favorite,
                                  data.ArtWork,
                                  data.DelMark,
                                  undefined,
                                ],
                              (err) => {  if(err) { log.error('addItem', err); reject(); } }
                  );
                  this.db.run("insert into T_ITEM VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                      [
                          IID
                        , data.SID
                        , data.Code
                        , data.Ext
                        , data.LinkIID
                        , data.Year
                        , data.Title
                        , data.SubTitle
                        , data.AlbumArtist
                        , data.Track
                        , data.PlayTime
                        , data.CurrentTime
                        , data.FrameH
                        , data.FrameW
                        , data.FrameRate
                        , data.DataRate
                        , data.SampleRate
                        , data.SampleSize
                        , data.ChannelCount
                        , data.StreamNumber
                        , data.ContentType
                        , data.FullPath
                        , data.PlayCount
                      ],
                  (err) => {  if(err) { log.error('addItem', err); reject(); } else {
                    resolve(IID);
                  }}
                  );
              });
          });
      } else {
        // 既に存在する場合破、削除します。
        if( data.IID != undefined )
        {
          delete data.IID;
        }
        return  this.updItem(exitData.IID, data);
      }
    } catch (error) {
      log.error("promise -> catch: error =", {error});
    }

    //-------------------------------------------------------
    return new Promise((resolve, reject) => {
      resolve(-1);
    });
  }
  // アイテム情報を更新します。
  async updItem(IID:number, data:{ [key: string]: any } ) : Promise<number>
  {
      let setDB:{ [key: string]: any }  = {};
      let setDI:{ [key: string]: any }  = {};

      for(let key of Object.keys(data) )
      {
        if( key == "PARENT_GID" ||
            key == "BaseType" ||
            key == "Name" ||
            key == "Comment" ||
            key == "Favorite" ||
            key == "ArtWork" ||
            key == "DelMark" ||
            key == "LatestCheck"  )
          {
            setDB[key] = data[key];
          }
          else
          {
            setDI[key] = data[key];
          }
     }

      return new Promise<number>((resolve, reject) => {
          this.db.serialize(() => {
            if( Object.keys(setDB).length != 0 )
            {
              let setD:any[] = [];
              let sql = ["update T_DATA_BASE set "];
              for(let key of Object.keys(setDB) )
              {
                if( setD.length != 0 ) {
                  sql.push(", ");
                }
                sql.push(key);
                sql.push("=?");
                setD.push(setDB[key]);
              }
              sql.push(" where DID=?;");
              setD.push( IID );

              this.db.run(sql.join(' '), setD,
                    (err) => {  if(err) { log.error('updItem', err); reject(); } }
                );
            }
            if( Object.keys(setDI).length != 0 )
            {
              let setD:any[] = [];
              let sql = ["update T_ITEM set "];
              for(let key of Object.keys(setDI) )
              {
                if( setD.length != 0 ) {
                  sql.push(", ");
                }
                sql.push(key);
                sql.push("=?");
                setD.push(setDI[key]);
              }
              sql.push(" where IID=?;");
              setD.push( IID );

              this.db.run(sql.join(' '), setD,
                    (err) => {  if(err) { log.error('updItem', err); reject(); } }
                );
            }
            resolve(IID);
          });
      });
  }
  // アイテム情報を削除します。
  async delItem( IID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {

            this.db.run("delete from T_ITEM2GROUP where IID=?;", [IID],
            (err) => {  if(err) { log.error('delItem', err); reject(); } }
            );
            this.db.run("delete from T_ITEM2TAG where IID=?;", [IID],
            (err) => {  if(err) { log.error('delItem', err); reject(); } }
            );
            this.db.run("delete from T_ITEM2GENRE where IID=?;", [IID],
            (err) => {  if(err) { log.error('delItem', err); reject(); } }
            );
            this.db.run("delete from T_ITEM where IID=?;", [IID],
            (err) => {  if(err) { log.error('delItem', err); reject(); } }
            );
            this.db.run("delete from T_DATA_BASE where DID=?;", [IID],
            (err) => {  if(err) { log.error('delItem', err); reject(); } }
            );

            resolve(undefined);
          });
      });
  }
  // アイテム情報のCurrentTimeを更新します。
  async updItemAtCurrentTime( IID:number, currentTime:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("update T_ITEM set CurrentTime=? where IID=?;", [currentTime, IID],
              (err) => {  if(err) { log.error('updItemAtCurrentTime', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテム情報のLatestCheckを更新します。
  async updItemAtLatestCheck( IID:number, date:Date )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("update T_DATA_BASE set LatestCheck=? where DID=?;", [ getDateTime2String(date), IID],
              (err) => {  if(err) { log.error('updItemAtLatestCheck', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  async convItemTBL3Cls(itm:T_ITEM, parent:ImpleGroup|null, isCheckExit:boolean = true) : Promise<ImpleFile>
  {
    let item:ImpleFile = new ImpleFile(
        itm!.Name == undefined ? "" : itm!.Name
       ,itm!.SID == undefined ? "" : itm!.SID);
    item.IID = itm!.IID;
    item.PARENT_GID = itm!.PARENT_GID;
    item.mcode = itm!.Code ?? "";
    item.ext = itm!.Ext ?? "";
    item.Favorite = itm!.Favorite;
    item.Year = itm!.Year;
    item.Comment = itm!.Comment;
    item.Title = itm!.Title;
    item.SubTitle = itm!.SubTitle;
    item.AlbumArtist = itm!.AlbumArtist;
    item.Track = itm!.Track;
    item.PlayTime = itm!.PlayTime;
    item.FrameH = itm!.FrameH;
    item.FrameW = itm!.FrameW;
    item.FrameRate = itm!.FrameRate;
    item.DataRate = itm!.DataRate;
    item.SampleRate = itm!.SampleRate;
    item.SampleSize = itm!.SampleSize;
    item.ChannelCount = itm!.ChannelCount;
    item.StreamNumber = itm!.StreamNumber;
    item.ContentType = itm!.ContentType;
    item.strFullPath = itm!.FullPath ?? "";
    item.ArtWork = itm!.ArtWork;
    item.PlayCount = itm!.PlayCount;
    item.DelMark = itm!.DelMark;
    item.LatestCheck = itm!.LatestCheck;

    if( isCheckExit === true ) {
        // ファイルが存在するか確認します。
        item.isCanAccsess = isExistFile(item.strFullPath);
    }

    //LinkIIDが設定されている場合は、LinkIIDの情報をロードします。
    if( itm!.LinkIID != undefined )
    {
      if( itm!.LinkIID != 0 )
      {
        let itmL = await this.getItemByIID( itm.LinkIID );
        if( itmL != undefined )
        {
          item.linkItem = await this.convItemTBL3Cls(itmL, parent);
          if( item.linkItem != undefined ) {
            // log.debug("Link item loaded");
            // log.debug("   Link:", item.strFullPath);
            // log.debug("   Link:", item.linkItem.strFullPath);
          }
        }
        else
        {
          log.error(`itm.LinkIID${itm.LinkIID} is not regidterd. ItemID:${item.IID }`);
        }
      }
      else
      {
        if( item.ext == "lnk") {
          log.error(`itm.LinkIID:(${itm.LinkIID}) is Zero. ItemID:${item.IID }`);

          // リンク情報を解決出来ていない場合は、再解決します。

          let itmL = await resolveLinkAtFile(this, item, undefined);
          if( itmL != undefined )
          {
            item.linkItem = await this.convItemTBL3Cls(itmL!, parent);
            if( item.linkItem != undefined ) {
              // log.debug("Link item loaded");
              // log.debug("   Link:", item.strFullPath);
              // log.debug("   Link:", item.linkItem.strFullPath);
            }
          }
        }

      }
    }
    return item;
  }
  // 親のGIDに紐づく子のアイテムのDelMakをOnに設定します。
  async updItemDelMarkByParentGID(PANRET_GID:number)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("update T_DATA_BASE set DelMark=1 where PARENT_GID=?;", [PANRET_GID],
              (err) => {  if(err) { log.error('updItemDelMarkByParentGID', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }

  // 親のGIDとSIDに紐づく子のアイテムのDelMakをOnに設定します。
  async updItemDelMarkByParentGIDSID(PANRET_GID:number, SID:string)
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("update T_ITEM set DelMark=1 where GID=? and SID=?;", [PANRET_GID, SID],
              (err) => {  if(err) { log.error('updItemDelMarkByParentGIDSID', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }





  //------------------------------------------------------------
  //  T_ITEM2TAG
  //      IID	アイテムID	Int		N	Y
  //      TAG_ID	タグID	Int		N	Y
  //------------------------------------------------------------
  // アイテムにリンクしているアイテム一覧を取得
  async getItem2Tags( IID:number ):Promise<T_ITEM2TAG[]>
  {
      return new Promise<T_ITEM2TAG[]>((resolve, reject) => {
          this.db.all("SELECT TAG_ID FROM T_ITEM2TAG where IID = ?;", [IID], (err, rows:T_ITEM2TAG[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItem2Tags', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
//select T_ITEM2TAG.TAG_ID as id, M_TAG.Name as name from T_ITEM2TAG inner join M_TAG ON T_ITEM2TAG.TAG_ID = M_TAG.TAG_ID;
async getItem2Tags_IncName( IID:number ): Promise<ImpleIdName[]>
{
    return new Promise<ImpleIdName[]>((resolve, reject) => {
        let ret:ImpleIdName[] = [];
        this.db.all("select T_ITEM2TAG.TAG_ID as ID, M_TAG.Name as NAME from T_ITEM2TAG inner join M_TAG ON T_ITEM2TAG.TAG_ID = M_TAG.TAG_ID where T_ITEM2TAG.IID = ?;", [IID], (err, rows:ID_NAME[]) => {
            if (err) {
                // エラー発生時.
                log.error('getItem2Tags_IncName', err);
                reject();
                return;
            }

            for(let row of rows)
            {
              ret.push( { id: row.ID, name:row.NAME} );
            }
            resolve(ret);
        });
    });
}
  // アイテムにリンクしているアイテムを登録します。
  async addItem2Tag( IID:number, TAG_ID:number )
  {
      let items  = await this.getItem2Tags(IID);
      if( items != undefined )
      {
          for(let item of items)
          {
              if( item.TAG_ID == TAG_ID )
              {
                  log.error("already exit T_ITEM2TAG(" +  TAG_ID + ") in " + IID );
                  return ;
              }
          }
      }

      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into T_ITEM2TAG VALUES(?, ?);",
                  [IID, TAG_ID],
                  (err) => {  if(err) { log.error('addItem2Tag', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムにリンクしているアイテムを削除します。
  async delItem2Tag( IID:number, TAG_ID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEM2TAG where IID=? AND TAG_ID=?;", [IID, TAG_ID],
              (err) => {  if(err) { log.error('delItem2Tag', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムにリンクしているアイテムを削除します。
  async delItem2TagByIID( IID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEM2TAG where IID=?;", [IID],
              (err) => {  if(err) { log.error('delItem2TagByIID', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }



  //------------------------------------------------------------
  //  T_ITEM2GENRE
  //      IID	アイテムID	Int		N	Y
  //      GENRE_ID	ジャンルID	Int		N	Y
  //------------------------------------------------------------
  // アイテムに関連付けられたジャンル一覧を取得
  async getItem2Genres( IID:number )
  {
      return new Promise<T_ITEM2GENRE[]>((resolve, reject) => {
          this.db.all("SELECT GENRE_ID FROM T_ITEM2GENRE where IID = ?;", [IID], (err, rows:T_ITEM2GENRE[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItem2Genres', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  async getItem2Genres_IncName( IID:number ): Promise<ImpleIdName[]>
  {
      return new Promise<ImpleIdName[]>((resolve, reject) => {
          let ret:ImpleIdName[] = [];
          this.db.all("select T_ITEM2GENRE.GENRE_ID as ID, M_GENRE.Name as NAME from T_ITEM2GENRE inner join M_GENRE ON T_ITEM2GENRE.GENRE_ID = M_GENRE.GENRE_ID where T_ITEM2GENRE.IID = ?;", [IID], (err, rows:ID_NAME[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getItem2Genres_IncName', err);
                  reject();
                  return;
              }

              for(let row of rows)
              {
                ret.push( { id: row.ID, name:row.NAME} );
              }
              resolve(ret);
          });
      });
  }
  // アイテムに関連付けられたジャンルを登録します。
  async addItem2Genre( IID:number, GENRE_ID:number )
  {
      let items = await this.getItem2Genres(IID);
      if( items != undefined )
      {
          for(let item of items)
          {
              if( item.GENRE_ID == GENRE_ID )
              {
                  log.error("already exit T_ITEM2GENRE(" +  GENRE_ID + ") in " + IID );
                  return ;
              }
          }
      }

      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into T_ITEM2GENRE VALUES(?, ?);",
                  [IID, GENRE_ID],
                  (err) => {  if(err) { log.error('addItem2Genre', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムに関連付けられたジャンルを削除します。
  async delItem2Genre( IID:number, GENRE_ID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEM2GENRE where IID=? AND GENRE_ID=?;", [IID, GENRE_ID],
              (err) => {  if(err) { log.error('delItem2Genre', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }
  // アイテムに関連付けられたジャンルを削除します。
  async delItem2GenreByIID( IID:number )
  {
      return new Promise((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("delete from T_ITEM2GENRE where IID=?;", [IID],
              (err) => {  if(err) { log.error('delItem2GenreByIID', err); reject(); } else { resolve(undefined); }}
              );
          });
      });
  }

  //------------------------------------------------------------
  // CK_QUERY_DATA
  //  UID	未使用。常に０。将来的にユーザーIDにするかも・・・	Int		N	Y
  //  GID	グループID	Int		N	Y
  //  Favorite	お気に入り	Int		N
  //  QueryTitle	絞り込み文字	vaechar	256
  //------------------------------------------------------------
 /*
export type CK_QUERY_DATA = {
  UID: number;
  GID: number;
  Favorite: number|undefined;
  QueryTitle: string|undefined;
};
*/

  // ページの絞り込み情報を覚えておくデータ一覧を取得
  async getQueryDataList( UID:number )
  {
      return new Promise<CK_QUERY_DATA[]>((resolve, reject) => {
          this.db.all("SELECT * FROM CK_QUERY_DATA where UID = ?;", [UID], (err, rows:CK_QUERY_DATA[]) => {
              if (err) {
                  // エラー発生時.
                  log.error('getQueryDataList', err);
                  reject();
                  return;
              }
              resolve(rows);
          });
      });
  }
  // ページの絞り込み情報を覚えておくデータを取得
  async getQueryData( UID:number, GID:number )
  {
      return new Promise<CK_QUERY_DATA>((resolve, reject) => {
          this.db.get("SELECT * FROM CK_QUERY_DATA where UID = ? and GID = ?;", [UID,GID], (err, row:CK_QUERY_DATA) => {
              if (err) {
                  // エラー発生時.
                  log.error('getQueryData', err);
                  reject();
                  return;
              }
              resolve(row);
          });
      });
  }
  // ページの絞り込み情報を覚えておくデータを新規追加　OR　既に存在する場合は、更新します。
  async addQueryData( UID:number, GID:number
    , Favorite:number|undefined, QueryTitle:string|undefined )
  {
    try {
      // 既にアイテムが登録されていないかチェックします。
      let exitData = await this.getQueryData(UID, GID);
      if( exitData == undefined  )
      {

        return new Promise<number>((resolve, reject) => {
          this.db.serialize(() => {
              this.db.run("insert into CK_QUERY_DATA values(?, ?, ?, ?);",
              [UID,GID,Favorite,QueryTitle],
              (err) => { if(err) { log.error('addQueryData', err); reject(); } else { resolve(0); } }
              );
          })
        });
      } else {
        let data:{ [key: string]: any } = {};
        data["Favorite"] = Favorite;
        data["QueryTitle"] = QueryTitle;
        return  this.updQueryData(UID, GID, data);
      }
    } catch (error) {
      log.error("promise -> catch: error =", {error});
    }
  }
  // ページの絞り込み情報を覚えておくデータを更新します。
  async updQueryData( UID:number, GID:number,  data:{ [key: string]: any } )
  {
    try {
        return new Promise<number>((resolve, reject) => {
          this.db.serialize(() => {

            let setD:any[] = [];
            let sql = ["update CK_QUERY_DATA set "];
            for(let key of Object.keys(data) )
            {
              if( setD.length != 0 ) {
                sql.push(", ");
              }
              sql.push(key);
              sql.push("=?");
              setD.push(data[key]);
            }
            sql.push(" where UID = ? and GID = ?;");
            setD.push( UID );
            setD.push( GID );

            this.db.run(sql.join(' '), setD,
                (err) => {  if(err) { log.error(err); reject(); } else {
                  resolve(0);
                }}
            );
        });
        });

    } catch (error) {
      log.error("promise -> catch: error =", {error});
    }
  }


  //-----------------------------------------------------------------
  //
  //  Search Free Word
  //
  //-----------------------------------------------------------------
  // フリーワードで検索した時の検索結果数を取得します。
  async countOfResultSearchFreeWord( word:string )
  {
    try {
        return new Promise<number>((resolve, reject) => {
          let strWildWord = `%${word}%`;
          let sql = ['select count(B.DID) as countOfid  '];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  left join T_GROUP AS G');
          sql.push('    ON B.DID = G.GID');
          sql.push('  left join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push(' where B.Name like ?');
          sql.push(' or    B.Comment like ?');
          sql.push(' or    G.SearchName like ?');
          sql.push(' or    I.Code like ?');
          sql.push(' or    I.Title like ?');
          sql.push(' or    I.SubTitle like ?');
          sql.push(' or    I.AlbumArtist like ?');
          sql.push(';');
          this.db.get(sql.join(' '), [strWildWord,
            strWildWord,strWildWord,strWildWord,strWildWord,
            strWildWord,strWildWord], (err, row:any) => {
            if (err) {
                // エラー発生時.
                log.error('countOfResultSearchFreeWord', err);
                reject();
                return;
            }
            resolve(row.countOfid);
         });
        });

    } catch (error) {
      log.error("promise -> catch: error =", {error});
    }
  }

  async searchFreeWord( word:string // 検索文字
        , iPageLimit:number // 取得する最大レコード数
        , iPageOffset:number  // 取得を開始する位置。０～
  )
  {
    try {
        return new Promise((resolve, reject) => {
          let strWildWord = `%${word}%`;
          let sql = ['select B.*,G.*,I.*'];
          sql.push('from T_DATA_BASE AS B');
          sql.push('  left join T_GROUP AS G');
          sql.push('    ON B.DID = G.GID');
          sql.push('  left join T_ITEM AS I');
          sql.push('    ON B.DID = I.IID');
          sql.push(' where B.Name like ?');
          sql.push(' or    B.Comment like ?');
          sql.push(' or    G.SearchName like ?');
          sql.push(' or    I.Code like ?');
          sql.push(' or    I.Title like ?');
          sql.push(' or    I.SubTitle like ?');
          sql.push(' or    I.AlbumArtist like ?');
          sql.push(' LIMIT ? OFFSET ?');
          sql.push(';');
          this.db.all(sql.join(' '), [strWildWord,
            strWildWord,strWildWord,strWildWord,strWildWord,
            strWildWord,strWildWord,
            iPageLimit, iPageOffset], (err, rows) => {
            if (err) {
                // エラー発生時.
                log.error('serchFreeWord', err);
                reject();
                return;
            }
            resolve(rows);
         });
        });

    } catch (error) {
      log.error("promise -> catch: error =", {error});
    }
  }



};





//---------------------------------------------------------------
//
export async function testSqlImp(strDbPath:string)
{
  try {
        const db = new SqlImpl( strDbPath );
        await db.createTblIfNotExit();
        await db.addStrage({SID:"Master", Path:"aaaa"});
        await db.addStrage({SID:"Slive", Path:"bbbb"});
        log.debug("getStragesAsArray", await db.getStragesAsArray() );
        await db.delStrage("Master");
        await db.delStrage("Slive");
        log.debug("getStragesAsArray", await db.getStragesAsArray() );

        await db.addGenre("aaaa");
        await db.addGenre("bbbb");
        let Genres = await db.getGenres();
        log.debug("getGenres", await Genres );
        log.debug("getGenreByName", await db.getGenreByName("aaaa") );
        log.debug("getGenreByName", await db.getGenreByName("non-exist") );
        for(let itm of Genres)
        {
          await db.delGenre(itm.GENRE_ID);
        }
        Genres = await db.getGenres();
        log.debug("getGenres", await Genres );


        await db.addTag("aaaa");
        await db.addTag("bbbb");
        let Tags = await db.getTags();
        log.debug("getTags", Tags );
        log.debug("getTagByName", await db.getTagByName("aaaa") );
        log.debug("getTagByName", await db.getTagByName("non-exist") );
        for(let itm of Tags)
        {
          await db.delTag(itm.TAG_ID);
        }
        Tags = await db.getTags();
        log.debug("getTags", Tags );

        await db.addGroup({GID:-1,PARENT_GID:-1, Name:"aaaa", Lname:"Local1", Important:0}, true, true);
        await db.addGroup({GID:-1,PARENT_GID:-1, Name:"bbbb", Lname:"Local2", Important:0}, true, true);
        let agroups = await db.getGroups(-1);
        log.debug("getTags", agroups );
        log.debug("getGroupByName", await db.getGroupByName("aaaa") );
        log.debug("getGroupByName", await db.getGroupByName("non-exist") );
        log.debug("getGroupByNameFuzzy", await db.getGroupByNameFuzzy("Local2") );
        for(let itm of agroups)
        {
          await db.delGroup(itm.GID);
        }
        agroups = await db.getGroups(-1);
        log.debug("getTags", agroups );


        await db.addItem({
          Name: "aaaa", Code: "Code001", SID: "Master"
        });
        await db.addItem({
          Name: "bbbb", Code: "Code002", SID: "Silver"
        });
        let items = await db.getItemsAtGID(-1);
        log.debug("getItemsAtGID", items );
        log.debug("getItemByName", await db.getItemByName(-1, "aaaa") );
        log.debug("getItemByName", await db.getItemByName(-1, "non-exist") );
        for(let itm of items)
        {
          await db.updItem(itm.IID, {Name:itm.Name+".Modify", Ext:"mp4"});
        }
        items = await db.getItemsAtGID(-1);
        log.debug("After updItem", items );

        for(let itm of items)
        {
          await db.delItem(itm.IID);
        }
        items = await db.getItemsAtGID(1);
        log.debug("getItemsAtGID", items );

        //
      } catch(e) {
        log.debug("Errir", e);
      }
}


export async function importDataInDbAtGroup(db:SqlImpl
  , group:ImpleGroup
  , PARENT_GID:number
  , recurOpt:GRP_INTEGRQTE
  , options?:{
    isGroupOnly:boolean|undefined,
    isGetMetaDeta:boolean|undefined
  }
  , funcProc?:Function)
{
  let newGroup:{[key: string]: any} = {
      GID:-1,
    PARENT_GID: PARENT_GID,
    DirName: group.DirName,
    Name: group.Name,
    SearchName: group.SearchName
  };



  if( recurOpt.recurKind != undefined ) {
    newGroup.Kind = recurOpt.recurKind ?? newGroup.Kind;
    delete recurOpt.recurKind;
  }
  if( recurOpt.recurSubKind != undefined ) {
    newGroup.SubKind = recurOpt.recurSubKind ?? newGroup.SubKind;
    delete recurOpt.recurSubKind;
  }

  if( group.Favorite != undefined ) {
    newGroup.Favorite = group.Favorite ?? newGroup.Favorite;
  }
  if( group.Kind != undefined ) {
    newGroup.Kind = group.Kind ?? newGroup.Kind;
  }
  if( group.SubKind != undefined ) {
    newGroup.SubKind = group.SubKind ?? newGroup.SubKind;
  }
  if( group.ArtWork != undefined ) {
    newGroup.ArtWork = group.ArtWork ?? newGroup.ArtWork;
  }
  if( group.Comment != undefined ) {
    newGroup.Comment = group.Comment ?? newGroup.Comment;
  }
  if( group.ConfigJson != undefined ) {
    newGroup.ConfigJson = group.ConfigJson ?? newGroup.ConfigJson;
  }

  //log.debug("group.Name:", group.Name, "  recurOpt.recurKind:", recurOpt.recurKind, "   recurOpt.recurSubKind:", recurOpt.recurSubKind);

  //
  //  グループ名を統合する設定がある場合。
  //
  //  Ｃａｓｅ：
  //   曲数が多く、Ｐｒｉｎｃｅの音楽がファイルをストレージに分けている。
  //    ストレージＡに、　Prince
  //    ストレージＢに、　Prince
  //　　こういった場合、Ｐｒｉｃｅグループは、同じＰｒｉｃｅとして扱う場合、
  //    このオプション（integrateGroup）にtrueを設定しておきます。
  let bIntegrateGrp:boolean = group.integrateGroup == undefined ? recurOpt.recurIntegrateGroup : group.integrateGroup!;
  let isMaster:boolean = recurOpt.recurMaster;
  if( group.config != undefined )
  {
    // Masterではない場合、親GIDが、コンフィグ情報を上書きしないようにするため、
    // Masterフラグがセットされているかチェックします。
    if( group.config!.isMaster != undefined )
    {
      isMaster = group.config!.isMaster;
    }
  }

  // 子のグループ名を統合するかどうかの設定

  // グループの追加
  let GID:number = await db.addGroup(newGroup, bIntegrateGrp, isMaster);
  log.debug("group.strages:", group.strages);
  for(let key2 in group.strages)
  {
    // グループのあるストレージを追加
    await db.addGroup2Strage(GID, key2, group.strages[key2])
  }
  let chiledRecurOpt:GRP_INTEGRQTE = new GRP_INTEGRQTE;
  chiledRecurOpt.set( group.config );
  group.GID = GID;
  for(let key2 in group.subgroups)
  {
    //　再帰的にグループを登録
    await importDataInDbAtGroup(db, group.subgroups[key2], GID, chiledRecurOpt, options, funcProc);
  }

  if( options?.isGroupOnly == false )
  {
    let total = group.files.length;
    let curNo = 0;
    //let strages = await db.getStragesAsDeco();

    // for(let SID in strages )
    // {
    //   if( strages[SID].IsExist ) {
    //     // アクセス可能なものだけ削除します。
    //     // このグループに紐づくT＿ITEMについて、削除マークをセットします。
    //     await db.updItemDelMarkByParentGIDSID( GID, SID );
    //   }
    // }


    for(let fileD of group.files)
    {
      curNo++;
      if( funcProc != undefined ) {
        await funcProc!(3, `${curNo}/${total} DB import file. .  ${fileD.name}` );
      }

     // fileD.group = group;
      fileD.PARENT_GID = GID;
      await importDataInDbAtFile(db, fileD, funcProc);
    }
  }
}



// リンク情報を解決します。
export async function resolveLinkAtGroup(db:SqlImpl
  , group:ImpleGroup
  , funcProc?:Function)
{
  for(let fileD of group.files)
  {
    await resolveLinkAtFile(db, fileD, funcProc);
  }
}

// リンク情報を解決します。
export async function resolveLinkAtFile(db:SqlImpl
  , fileD:ImpleFile
  , funcProc?:Function) : Promise<T_ITEM|undefined>
{
  if( fileD.ext.toLowerCase() != 'lnk' ) {
    return undefined;
  }
  if( isExistFile(fileD.strFullPath) == false )
  {
    if( funcProc != undefined ) {
      await funcProc!(-101, `  cannot access link file ${fileD.strFullPath}` );
    }
    return undefined;
  }
  // リンク先のパスを取得
  let strDistinationPath = getShortcutDestinationPath(fileD.strFullPath);

  // リンク先のパスで、FullPathに同じ値も持つ、T_ITEMを取得します。
  let items = await db.getItemsSpWhere("where I.FullPath=?", [strDistinationPath]);
  if( items.length == 0 )
  {
    // リンク先がない
    if( funcProc != undefined ) {
      await funcProc!(-109, `link destination path is not registered. Link File:[${fileD.strFullPath}]. destination path:[${strDistinationPath}]` );
    }

    return undefined;
  }
  else
  {
    // リンク先がある
    if( funcProc != undefined ) {
      await funcProc!(109, `registered link destination path. Link File:[${fileD.strFullPath}]. destination path:[${strDistinationPath}]` );
    }
    let setVal = {"LinkIID":items[0].IID};
    await db.updItem(fileD.IID, setVal);

    return items[0];
  }
}



// アイテムデータをインポートします。
export async function importDataInDbAtFile(db:SqlImpl, fileD:ImpleFile, funcProc?:Function)
{
  try {

    let props:any = fileD.RawTags;// undefined;
    /*
    IMAGEファイルの場合破、以下のプロパティがある。
      imgCx: 640,
      imgCy: 428,
      imgBitDepth: 24,
      imgResolutionX: 72,
      imgResolutionY: 72

      imgCx　-> frameWidth
      imgCy-> frameHeight
      imgBitDepth-> frameRate
      として登録します。
    */
    if( props != undefined )
    {
      if( props.imgCx != undefined )
      {
        props["frameWidth"] = props.imgCx;
      }
      if( props.imgCy != undefined )
      {
        props["frameHeight"] = props.imgCy;
      }
      if( props.imgBitDepth != undefined )
      {
        props["frameRate"] = props.imgBitDepth;
      }
    }

    let newItem:{[key: string]: any} = {
        PARENT_GID:fileD.PARENT_GID
      , SID:fileD.SID
      , Name:fileD.name
      , Code:fileD.mcode
      , Ext:fileD.ext
      , LinkIID:0
      , FullPath:fileD.strFullPath
    };
    if( props != undefined )
    {
      fileD.Favorite = newItem.Favorite = props!.evaluation ?? fileD.Favorite;
      fileD.Year = newItem.Year = props!.year ?? fileD.Year;
      fileD.Comment = newItem.Comment = props!.comment ?? fileD.Comment;
      fileD.Title = newItem.Title = props!.title ?? fileD.Title;
      fileD.SubTitle = newItem.SubTitle = props!.subTitle ?? fileD.SubTitle;
      fileD.AlbumArtist = newItem.AlbumArtist = props!.albumArtist ?? fileD.AlbumArtist;
      fileD.Track = newItem.Track = props!.track ?? fileD.Track;
      fileD.PlayTime = newItem.PlayTime = props!.playTime ?? fileD.PlayTime;
      fileD.FrameH = newItem.FrameH = props!.frameHeight ?? fileD.FrameH;
      fileD.FrameW = newItem.FrameW = props!.frameWidth ?? fileD.FrameW;
      fileD.FrameRate = newItem.FrameRate = props!.frameRate ?? fileD.FrameRate;
      fileD.DataRate = newItem.DataRate = props!.dataRate ?? fileD.DataRate;
      fileD.SampleRate = newItem.SampleRate = props!.sampleRate ?? fileD.SampleRate;
      fileD.SampleSize = newItem.SampleSize = props!.sampleSize ?? fileD.SampleSize;
      fileD.ChannelCount = newItem.ChannelCount = props!.channelCount ?? fileD.ChannelCount;
      fileD.StreamNumber = newItem.StreamNumber = props!.streamNumber ?? fileD.StreamNumber;
      fileD.ContentType = newItem.ContentType = props!.contentType ?? fileD.ContentType;
    }
    // アイテムを追加します。
    let IID:number = await db.addItem(newItem);
    fileD.IID = IID;
    if( props != undefined )
    {
      if( props.artists != undefined )
      {
        // 更新するケースもあるので、一旦削除します。
        await db.delItem2GidByIID(IID);

        // アイテムに参加しているグループを登録します。
        for(let artist of props.artists)
        {
          let grp:T_GROUP = await db.getGroupByNameFuzzy(artist);
          if( grp != undefined )
          {
            await db.addItem2Gid(IID, grp.GID);
          } else {
            log.warn("non register artist name.[" + artist + "]. on [" + newItem.strFullPath + "]" );
          }
        }
      }
      if( props.tags != undefined )
      {
        // 更新するケースもあるので、一旦削除します。
        await db.delItem2TagByIID(IID);

        // アイテムに参加しているグループを登録します。
        for(let tag of props.tags)
        {
          let TAG_ID = await db.addTag(tag);
          if( TAG_ID != undefined )
          {
            await db.addItem2Tag(IID, TAG_ID);
          }
        }
      }
      if( props.genre != undefined )
      {
        // 更新するケースもあるので、一旦削除します。
        await db.delItem2GenreByIID(IID);

        // アイテムに参加しているグループを登録します。
        for(let g of props.genre)
        {
          let GENRE_ID = await db.addGenre(g);
          if( GENRE_ID != undefined )
          {
            await db.addItem2Genre(IID, GENRE_ID);
          }
        }
      }
    }
  } catch (error) {
    log.error("promise -> catch: error =", {error});
  }
}




//
export async function importDataInDb(
      strDbPath:string,
      groups:{ [key: string]: ImpleGroup },
      options?:{
        isGroupOnly:boolean|undefined,
        isGetMetaDeta:boolean|undefined
      }
      , funcProc?:Function)
{
  const db = new SqlImpl( strDbPath );
  try {
    await db.doBegin();
    for(let key in groups)
    {
      let recurOpt:GRP_INTEGRQTE = new GRP_INTEGRQTE;
      let group = groups[key];
      recurOpt.set( group.config );
      for(let key2 in group.subgroups)
      {
        //　再帰的にグループを登録
          await importDataInDbAtGroup(db, group.subgroups[key2], -1,  recurOpt, options, funcProc);
      }
    }

    for(let key in groups)
    {
      let group = groups[key];

      // 同名の定義がある場合は、グループ名で検索して、見つかった場合登録します。
      await regitSamePersonGroup(group, db, funcProc);
      // リンク情報を解決します。
      await resolveLinkAtGroup_Recur( group , db , funcProc);
    }

    await db.doCommit();
  } catch(e) {
    log.error("importDataInDb", e);
    if( funcProc != undefined ) {
      funcProc(-100, "db import error." + e);
    }

  }
  db.close();
}
// samePersonを登録
export async function regitSamePersonGroup(
    group:ImpleGroup
  , db:SqlImpl
  , funcProc?:Function)
{
  if( group.config != undefined )
  {
    if( group.config!.samePersons != undefined )
    {
        for(let sameName of group.config!.samePersons )
        {
          let sameNameGroup = await db.getGroupByName(sameName);
          if( sameNameGroup != undefined )
          {
            await db.addGRelation(group.GID, sameNameGroup.GID);
          } else {
            log.warn(`not regiter group name:${sameName}`);
          }
        }
    }
  }
  for(let key2 in group.subgroups)
  {
    //　再帰的にグループを登録
    await regitSamePersonGroup(group.subgroups[key2], db);
  }
}
// リンク情報を解決
export async function resolveLinkAtGroup_Recur(
                        group:ImpleGroup
                      , db:SqlImpl
                      , funcProc?:Function)
{
    for(let key2 in group.subgroups)
    {
      //　再帰的にグループを登録
      await resolveLinkAtGroup_Recur(group.subgroups[key2], db, funcProc);
    }

    // グループ直下のファイルのリンクの解決
    await resolveLinkAtGroup(db, group, funcProc);
}










// パンくずデータを取得します。
export async function getBreadcrumbData(strDbPath:string, iClass:number, ID:number) : Promise<BreadcrumbData[]>
{
  let retVal:BreadcrumbData[] = [];
  const db = new SqlImpl( strDbPath );
  try {

    while( ID != -1 )
    {
      if( iClass == 1 )
      {
        // グループ
        let grp = await db.getGroupByGID(ID);
        if( grp == undefined)
        {
          // エラー
          return retVal.reverse();
        }

        retVal.push( new BreadcrumbData(iClass,
          grp.GID,
          grp.Name
        ) );

        ID = grp.PARENT_GID;
      } else
      if( iClass == 2 )
      {
        // アイテム
        let item = await db.getItemByIID(ID);
        if( item == undefined)
        {
          // エラー
          return retVal.reverse();
        }

        let strDispName:string = "";
        if( item.Title != undefined ) {
          strDispName = item.Title;
        } else {
          strDispName = item.Name == undefined ? "???" : item.Name;
        }
        retVal.push( new BreadcrumbData(iClass,
          item.IID,
          strDispName
        ) );


        ID = item.PARENT_GID;
        iClass = 1;
      } else {
        ID = -1;
      }
    }

  } catch(e) {
    log.error("getBreadcrumbData", e);
  } finally {
    db.close();
  }

  // Home
  //retVal.push( new BreadcrumbData(0,
  //  0,
  //  "Home"
  //) );

  // 配列を反転させてリターンします。
  //
  //  Home > Group1 > Item1
  //
  return retVal.reverse();
}


// 再帰的に、サムネイル画像を作成します。
export async function makeThumbnailRecur(
    db:SqlImpl
  , group:ImpleGroup
  , confKind:{ [key: string]: number }
  , confSubSubKind:{ [key: string]: number }
  , funcProc?:Function)
{
  let iVideo:number = 0;
  let iMusic:number = 0;
  let iImage:number = 0;
  let imageFD:ImpleFile;
  //
  for(let item of group.files )
  {
    if( item.ext == "jpg" || item.ext == "jpeg" || item.ext == "png"  || item.ext == "gif" )
    {
      iImage++;
      imageFD = item;
    }
    else
    if( item.ext == "mp3" || item.ext == "m4a" || item.ext == "wav" )
    {
      iMusic++;
    }
    else
    if( item.ext == "mp4" || item.ext == "avi" || item.ext == "mpeg" || item.ext == "mov" )
    {
      iVideo++;
    }
  }
  if( iMusic > iImage || iVideo > iImage )
  {
    // 音楽アルバムだと判定
    if( iImage == 1 )
    {
      // アルバムのアートワークと判定
      if( hasValue( group.ArtWork ) == true )
      {
        if( group.ArtWork == imageFD!.strFullPath  )
        {
          // アートワークのイメージ破、DBから削除
          await db.updItem(imageFD!.IID, {DelMark:1});
        }
      }
      else
      {
        //
        await db.updGroup( group.GID, {ArtWork:imageFD!.strFullPath} );
        // アートワークのイメージは、DBから削除
        await db.updItem(imageFD!.IID, {DelMark:1});
      }
    }

    if( iMusic > iVideo )
    {
      group.Kind = confKind["music"];
      group.SubKind = confSubSubKind["album"];
    }
    else
    {
      group.Kind = confKind["video"];
      group.SubKind = confSubSubKind["non"];
    }
    await db.updGroup( group.GID,
      {
        Kind:group.Kind,
        SubKind:group.SubKind
      }
    );
  }

  // 既に作成済みのサムネイル画像があれば削除する。
  cleanupThumbnail(group);

  // サムネールを作成します。
  for(let item of group.files )
  {
    await makeThumbnailAtItem(db, item, group, funcProc );
  }
}



// 再帰的に、サムネイル画像を作成します。
export async function makeThumbnailAtItem(
              db:SqlImpl
            , item:ImpleFile
            , parentGroup:ImpleGroup
            , funcProc?:Function)
{
  if( funcProc != undefined ) {
    funcProc(253, "Making thumbnail...." + item.name );
  }
  try {
    let strArtwork = await makeThumbnail(item);
    if( strArtwork != "" )
    {
      item.ArtWork = strArtwork;
      await db.updItem( item.IID, {ArtWork:strArtwork} );
    }
    else{
      // 音楽ファイルで、アートワークがない場合、親のアルバムのアートワークを使用
      if( item.ext == "mp3" || item.ext == "m4a" || item.ext == "wav" )
      {
        if( hasValue( parentGroup.ArtWork ) == true && hasValue( item.ArtWork ) == false   )
        {
          item.ArtWork = parentGroup.ArtWork;
          await db.updItem(item!.IID, {ArtWork:item.ArtWork});
        }
      }
    }
  } catch(e) {
    log.error("makeThumbnailAtItem", e);
    if( funcProc != undefined ) {
      funcProc(-105, "make thumbnail error." + e);
    }
  }
}
