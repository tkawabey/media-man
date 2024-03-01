import path from 'path';
import { getCodeString } from './commonfunc';
import log from 'electron-log';
import ConfigAcc from "./config-acc";
//const winshortcut = require('winshortcut');

/* グループ情報 */
export class ImpleGroup {
  GID: number;
  PARENT_GID: number;
  DirName: string; // ディレクトリ名	vaechar	256	N
  Name: string; // グループ名前
  SearchName: string; // 検索名
  Favorite: number | undefined; //	お気に入り
  Kind: number | undefined; //	分類1	Int				0:Image/1:Music/2:Video
  SubKind: number | undefined; //	分類2	Int				0:Artist/2:Alubam
  ArtWork: string | undefined; // ローカル名
  Comment: string | undefined; // コメント
  ConfigJson: string | undefined; // config.jsonの内容
  DelMark: number | undefined; // 削除マーク	Int
  subgroups: { [key: string]: ImpleGroup }; //　サブグループ
  strages: { [key: string]: string }; //　ストレージ一覧
  subgroupsArray: Array<ImpleGroup>; // ファイル一覧
  files: Array<ImpleFile>; // ファイル一覧
  LatestCheck: string | undefined; //	確認日時	vaechar	256	Y
  config: any | undefined; // config.json連想配列
  integrateGroup: boolean | undefined; // ストレージ間で、同じ名前のグループがある場合は、統合するかどうか？

  sameGrps: Array<ImpleIdName>|undefined; // 同名のグループ

  constructor(
    dirName: string,
    name: string,
    searchName: string | undefined | null,
  ) {
    this.GID = -1;
    this.PARENT_GID = -1;
    this.DirName = dirName;
    this.Name = name;
    this.subgroups = {};
    this.strages = {};
    this.files = [];
    this.subgroupsArray = [];

    if (searchName == undefined || searchName == null) {
      this.SearchName = name;
    } else if (searchName.trim().length == 0) {
      this.SearchName = name;
    } else {
      this.SearchName = searchName;
    }
  }

  getName() {
    const strName = this.Name;

    return strName;
  }
}

/* ID&Name */
export class ImpleIdName {
  id: number;

  name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}


/* ファイル情報 */
export class ImpleFile {
  IID: number;
  PARENT_GID: number;
//  group: ImpleGroup | null;
  name: string;
  mcode: string;
  ext: string;
  SID: string;
  isLink: boolean;
  strLinkTarget: string;
  cntLinked: Array<ImpleFile>;
  strFullPath: string;
  // この下のメンバーはメタデータの情報
  Favorite: number | undefined; //	評価	Int		N		0-100
  Year: number | undefined; //	年	Int		Y
  Comment: string | undefined; //	コメント	vaechar	256	Y
  Title: string | undefined; //	タイトル	vaechar	256	Y
  SubTitle: string | undefined; //	サブタイトル	vaechar	256	Y
  AlbumArtist: string | undefined; //	アルバムアーティスト	vaechar	256	Y
  Track: number | undefined; //	トラック	Int		Y
  PlayTime: string | undefined; //	時間	vaechar	256	Y
  CurrentTime: number | undefined; //	現在の再生時刻	double
  FrameH: number | undefined; //	フレーム高	Int		Y
  FrameW: number | undefined; //	フレーム幅	Int		Y
  FrameRate: number | undefined; //	レート	Int		Y
  DataRate: number | undefined; //	データレート	Int		Y
  SampleRate: number | undefined; //	サンプルレート	Int		Y
  SampleSize: number | undefined; //	サンプルサイズ	Int		Y
  ChannelCount: number | undefined; //	チャンネルカウント	Int		Y
  StreamNumber: number | undefined; //	ストリームNo	Int		Y
  ContentType: string | undefined; //	コンテントタイプ(MIME)	vaechar	256	Y
  ArtWork: string | undefined; //		サムネイル画像情報	vaechar	256
  PlayCount: number | undefined; //		再生回数	Int
  DelMark: number | undefined; //		削除マーク	Int
  artists: ImpleIdName[] | undefined;
  tags: ImpleIdName[] | undefined;
  genres: ImpleIdName[] | undefined;
  // ここまで
  LatestCheck: string | undefined; //	確認日時	vaechar	256	Y
  RawTags: any | undefined;
  isCanAccsess: boolean;  // アクセス可能かどうか？

  linkItem: ImpleFile | undefined;


  constructor(name: string, SID: string) {


    this.IID = -1;
    this.PARENT_GID = -1;
    this.name = name; // ファイル名
    this.mcode = ''; // コード　ファイルの先頭から最初のスペースまでの文字で、^[A-Za-z]*-[0-9]* とします
    this.ext = ''; // ファイルの拡張子
    this.SID = SID; // ストレージ名
    this.isLink = false; // ショートカットかどうか
    this.strLinkTarget = ''; // ショートカットの先のファイルのパス
    this.cntLinked = []; // このファイルに対してショートカットが作成されているショートカットファイルのフルパス
    this.strFullPath = '';
    this.isCanAccsess = true;

    // 管理コード
    this.mcode = getCodeString(name);
    // 拡張子
    const idx = name.lastIndexOf('.');
    if (idx != -1) {
      this.ext = name.substring(idx + 1);
    }

    this.ext = this.ext.toLocaleLowerCase(); // 小文字に変換
  }
}

/* パンくずデータ */
export class BreadcrumbData {
  iClass: number; /* 0:ホーム /1:グループ /2:アイテム */

  ID: number;

  TEXT: string;

  constructor(iClass: number, ID: number, TEXT: string) {
    this.iClass = iClass;
    this.ID = ID;
    this.TEXT = TEXT;
  }
}

/* グループ名統合データ */
export class GRP_INTEGRQTE
{
  /// 配下の同名のグループ名統合するかどうか
  recurIntegrateGroup:boolean;
  /// 配下の同名のグループ名統合する場合、マスターグループにするかどうか？
  recurMaster:boolean;
  /// 配下の同名のグループのKind
  recurKind:number|undefined;
  /// 配下の同名のグループのSubKind
  recurSubKind:number|undefined;


  constructor() {
    this.recurIntegrateGroup = false;
    this.recurMaster = false;
  }

  // ロードしたconfig.jsonから、メンバー変数を初期化します。
  set( config:any|undefined )
  {
    //log.debug("GRP_INTEGRQTE.set:", config);
    if( config == undefined || config == null ) {
      return ;
    }
    if( config!.recurIntegrateGroup != undefined )
    {
      this.recurIntegrateGroup = config!.recurIntegrateGroup;
    }
    if( config!.recurMaster != undefined )
    {
      this.recurMaster = config!.recurMaster;
    }
    if( config!.recurKind != undefined )
    {
      this.recurKind = ConfigAcc.getKindInt( config!.recurKind );
    }
    if( config!.recurSubKind != undefined )
    {
      this.recurSubKind = ConfigAcc.getSubKindInt( config!.recurSubKind );
    }
    //log.debug("   this.recurKind:", this.recurKind);
    //log.debug("   this.recurSubKind:", this.recurSubKind);
  }
}
