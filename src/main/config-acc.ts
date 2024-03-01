import log from 'electron-log';

class _ConfigAcc {

  targetExts: string[];
  output:string;
  db_name: string;
  kinds: { [key: string]: number };
  subKinds: { [key: string]: number };

  // 定数の定義
  CONDIG_DIR_NAME: string;
  CONDIG_JSON_FNAME: string;


  constructor() {
    this.targetExts = [];
    this.output = "output.txt";
    this.db_name = "media-man.db";
    this.kinds = {};
    this.subKinds = {};


    this.CONDIG_DIR_NAME = ".media-man";
    this.CONDIG_JSON_FNAME = "config.json";

  }

  //------------------------------
  // config.jsonをロード
  //------------------------------
  load()
  {
    try {
      let data  = require('../../assets/config.json');

      this.targetExts = data.targetExts ?? this.targetExts;
      this.db_name = data.db_name ?? this.db_name;
      this.output = data.output ?? this.output;
      this.kinds = data.kinds ?? this.kinds;
      this.subKinds = data.subKinds ?? this.subKinds;


      log.debug("Config,this.targetExts", this.targetExts);
      log.debug("Config,this.db_name", this.db_name);
      log.debug("Config,this.output", this.output);
      log.debug("Config,this.kinds", this.kinds);
      log.debug("Config,this.subKinds", this.subKinds);
    } catch( e ) {
      log.error("Error Config JSON.", e, "File:", "../../assets/config.json" );
    }
  }
  //------------------------------
  // Kindの文字データを数値データに変換
  //------------------------------
  getKindInt(strKind:string):number
  {
    if( this.kinds[strKind] != undefined )
    {
      return this.kinds[strKind];
    }
    return 0;
  }
  //------------------------------
  // Kindの文字データを数値データに変換
  //------------------------------
  getKindStr(iKind:number):string
  {
    for( let key in this.kinds )
    {
      if( this.kinds[key] == iKind )
      {
        return key;
      }
    }
    return 'non';
  }
  //------------------------------
  // SubKindの文字データを数値データに変換
  //------------------------------
  getSubKindInt(strSubKind:string):number
  {
    if( this.subKinds[strSubKind] != undefined )
    {
      return this.subKinds[strSubKind];
    }
    return 0;
  }
  //------------------------------
  // Kindの文字データを数値データに変換
  //------------------------------
  getSubKindStr(iSubKind:number):string
  {
    for( let key in this.subKinds )
    {
      if( this.subKinds[key] == iSubKind )
      {
        return key;
      }
    }
    return 'non';
  }



};



let ConfigAcc = new _ConfigAcc();
export default ConfigAcc;


