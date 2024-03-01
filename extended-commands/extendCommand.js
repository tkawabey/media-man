import path from 'path';
import fs from 'fs';
// cheerioモジュールを使用する宣言を行います
const cheerio = require("cheerio");
const { execSync, exec   } = require('child_process')
const http = require('http');
const https = require('https');
const log = require('electron-log');

// 拡張コマンドのメニューを返します。


function getGroupMenu(kind, subKind)
{
  let extCommand = [];
  if( kind == 4) // "video": 4
  {
    extCommand.push({Name:"Webスクレイピング", CommandName:"WebScrape"});
    extCommand.push({Name:"Webからの更新チェック", CommandName:"WebUpdateCheck"});
  }

  return extCommand;
}

// グループを指定した
async function execGroupCommand(commandName, config, db, group, notifyFunc)
{
  if( commandName == "WebScrape" )
  {
    await execCommandWebScrape(db, config, group, notifyFunc);
  }
  else
  if( commandName == "WebUpdateCheck" )
  {
    await execCommandWebUpdateCheck(db, config, group, notifyFunc);
  }
}






export { getGroupMenu, execGroupCommand };



function myHasValue(value) {
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
function isFirstCharAlphabet(str) {
  // 正規表現を使用して最初の文字がアルファベットかどうかをチェック
  return /^[A-Za-z]/.test(str);
}
function  isFirstCharNumber(str) {
  // 正規表現を使用して最初の文字が数値かどうかをチェック
  return /^[0-9]/.test(str);
}
// 指定したファイル名からコード文字を取得
function  getCodeString(strFileName)
{
    let mcode = "";
    if( isFirstCharAlphabet(strFileName) == true )
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
    return mcode;
}


async function execCommandWebScrape(db, config, group, notifyFunc)
{
  if( config.options == undefined )
  {
    // config.optionsが設定されていません。
    notifyFunc(-100, "config attribute is not defined.");
    return ;
  }

  for(let fileD of  group.files )
  {
    updataMetaData(db, config, group, fileD, notifyFunc);
  }
}

async function execCommandWebUpdateCheck(db, config, group, notifyFunc)
{
  if( config.options == undefined )
  {
    // config.optionsが設定されていません。
    notifyFunc(-100, "options attribute is not defined.");
    return ;
  }
  if( config.options.outputFile == undefined )
  {
    // config.optionsが設定されていません。
    notifyFunc(-100, "options.outputFile attribute is not defined.");
    return ;
  }
  let stroutputFile = config.options.outputFile;

  if( group.ConfigJson == undefined || group.ConfigJson == null || group.ConfigJson == "" )
  {
    notifyFunc(100, "config.json is empty");
    return ;
  }

  // 空ファイルを作成。すでにある場合は、クリアされます。
  fs.writeFileSync( stroutputFile, "\n");


  try {
    let obj = JSON.parse( group.ConfigJson );
    if( obj.URL == undefined )
    {
      notifyFunc(100, "URL is not defined.");
      return ;
    }
    if( obj.URL.length == 0 )
    {
      notifyFunc(100, "URL is list 0.");
      return ;
    }

    let cntNonexistInGrp = [];
    for(let url of obj.URL )
    {
      notifyFunc(100, "access url:" + url);
      fs.appendFileSync( stroutputFile, "access url:" + url + "\n");
      await checkUpdate(db, config, stroutputFile, cntNonexistInGrp, group, url, notifyFunc);

    }
    //await checkUpdateDB(db, config, stroutputFile, cntNonexistInGrp, group, notifyFunc);

    //
    try {
      for(let nonexist of cntNonexistInGrp )
      {
        let lowetCaseMoce = nonexist.mcode.toLowerCase();
        let opts = [];
        opts.push(lowetCaseMoce);

        let items = await db.getItemsSpWhere("where lower(I.Code)=?", opts );
        if( items.length == 0 )
        {
          fs.appendFileSync( stroutputFile, "\t" + nonexist.mcode + "\t" + nonexist.href + "\n" );
          notifyFunc(100, " *" + nonexist.mcode + "[" + nonexist.href + "]" );
        }
        else
        {
          for(let item of items )
          {
            fs.appendFileSync( stroutputFile, "\t" + nonexist.mcode + "\t" + item.FullPath + "\n" );
            notifyFunc(100, " *" + nonexist.mcode + "[" + item.FullPath + "]" );
          }
        }
      }
    } catch( e ) {
      notifyFunc(-1, "Check DB Error." + e );
      console.log("Check DB Error.", e);
    }



    notifyFunc(100, "outpt result file:" + stroutputFile);
    exec('cmd /c notepad.exe ' + stroutputFile, (err, stdout, stderr) => {
        if (err) {
          console.log(`stderr: ${stderr}`)
          return
        }
        console.log(`stdout: ${stdout}`)
      }
    );

  } catch( e ) {
    notifyFunc(-1, "WebUpdateCheck Error." + e );
    return ;
  }
}

// 指定下URLからレスポンスを同期で取得します。
const rqt = (url) => {
  return new Promise((resolve, reject)=> {

      let net ;
      if( url.startsWith("http://") == true ) {
        net = http;
      } else {
        net = https;
      }

      // GETリクエストを送信する例
      net.get(url, (response) => {
        let data = '';

        // データを受信すると呼ばれるコールバック
        response.on('data', (chunk) => {
          data += chunk;
        });

        // レスポンスの受信が完了したら呼ばれるコールバック
        response.on('end', () => {
          //console.log(data); // レスポンスのデータを表示するか、適切な処理を行うことができます
          resolve( data );
        });
      });
  });
}


async function  updataMetaData(db, config, group, fileD, notifyFunc)
{
  let isForceUpdMedaData = false;
  // コードがあるか？
  if( myHasValue(fileD.mcode) === false ) {
    return ;
  }
  // リンクでないか？
  if(  fileD.isLink === true )
  {
    return ;
  }
  // 拡張子が"mp4"
  if( fileD.ext != "mp4" )
  {
    return;
  }
  if( config.options != undefined )
  {
    if( config.options.forceUpdMedaData != undefined )
    {
      isForceUpdMedaData = config.options.forceUpdMedaData;
    }
  }


  if( !(fileD.Title == undefined  || fileD.Title == null ||  fileD.Title == "") )
  {
    if( isForceUpdMedaData == false )
    {
      notifyFunc(100, "mcode:" + fileD.mcode +  ". Title is already set. ");
      return;
    }
  }


  //　ファイルにアクセス可能か？確認します。
  if( fs.existsSync(fileD.strFullPath) == false ) {
    notifyFunc(100, "Cannot access file. FilePath:" + fileD.strFullPath );
    return;
  }

  notifyFunc(100, "mcode:" + fileD.mcode +  ". access.");
  try {
    const stdoutData = execSync('node C:\\work\\Projects\\webscrp\\main.js metaGet ' + fileD.mcode);

    if( stdoutData != undefined ) {

      let strJson = stdoutData.toString();
      let obj = JSON.parse( strJson );
      if( obj != undefined )
      {
        if( obj.status === true ) {
          let prop = obj.data;
          if( prop.length != 0 )
          {
            notifyFunc(100, "Updating Windows properties. FilePath:" + fileD.strFullPath);
            const winshortcut = require('winshortcut');

            winshortcut.setProps(fileD.strFullPath, prop);
          } else {
            notifyFunc(100, "no properties that can be set.");
          }
        }
        else
        {
          notifyFunc(-1, "Exec Command Error."  + obj.msg );
          console.error("Exec Command Error."  + obj.msg );
        }
      }
    }
  } catch( e ) {
    notifyFunc(-1, "HTTP Reqquest Error." + e );
    return ;
  }

}
async function  checkUpdateDB(db, config, strOptputPath, cntNonexistInGrp, group, notifyFunc)
{
  try {
    for(let nonexist of cntNonexistInGrp )
    {
      console.log("nonexist", nonexist );

      let lowetCaseMoce = nonexist.mcode.toLowerCase();
      let opts = [];
      opts.push(lowetCaseMoce);
      //console.log("db", db );
      let items = await db.getItemsSpWhere("where lower(I.Code)=?", opts );
      //console.log("items.length", items.length  );
      for(let item of items )
      {

      }
      fs.appendFileSync( strOptputPath, "\t" + nonexist.mcode + "\t" + nonexist.href + "\n" );
      notifyFunc(100, " *" + nonexist.mcode + "[" + nonexist.href + "]" );
    }
  } catch( e ) {
    notifyFunc(-1, "Check DB Error." + e );
    console.log("Check DB Error.", e);
    return ;
  }
}
async function  checkUpdate(db, config, strOptputPath, cntNonexistInGrp, group, url, notifyFunc)
{
  try {
    let res = await rqt(url);

    // cheerioを使用して、レスポンスを解析します
    const $ = cheerio.load(res);


    // 取得したいdivタグのクラス名を指定します。ここでは.archive-entry
    $(".archive-entry")
    // .archive-entryクラスのdivタグは複数とれるでの、eachメソッドでコールバックを登録します
    .each( function(){
      // title属性の値を取得
      let title = $(this).attr('title');
      // href属性の値を取得
      const href  = $(this).attr('href');
      let mcode = getCodeString(title);

      if( mcode != "")
      {
        // コードの指定がある。
        let bFound = false;
        for(let fileD of  group.files )
        {
            if( fileD.mcode == mcode )
            {
                bFound = true;
            }
        }
        if( bFound == false )
        {
          //fs.appendFileSync( strOptputPath, "\t" + mcode + "\t" + href + "\n" );
          //notifyFunc(100, " *" + mcode + "[" + href + "]" );

          let bFound2 = false;
          for( let obj2 of cntNonexistInGrp )
          {
            if(  obj2.mcode == mcode )
            {
              bFound2 = true;
              break;
            }
          }
          if( bFound2 === false )
          {
            cntNonexistInGrp.push( { "mcode":mcode, "href":href  } );
          }
        }
      }
    });


    let nextUrls = [];

    $(".pagination")
    .each( function(){
        const $2 = cheerio.load($(this).html());
        const liElements = $2('li a');
        let bFoundCur = false;

        liElements.each((index, element) => {
            const strPos = $(element).attr("class");
            const strHref = $(element).attr("href");
            //console.log( "\t" + strPos + "/" + strHref);
            if( strPos == "current") {
                bFoundCur = true;
            } else if( bFoundCur == true && strPos == "inactive" ) {
                //console.log( "\tNext page :" + strHref);
                nextUrls.push(strHref);
                bFoundCur = false;
                return;
            }
            //console.log( strPos + "/" + strHref);
        });
    });
    for(let nextUrl of nextUrls )
    {
      console.log("nextUrl", nextUrl);
      await checkUpdate(db, config, strOptputPath, cntNonexistInGrp, group, nextUrl, notifyFunc);
    }
  } catch( e ) {
    notifyFunc(-1, "HTTP Reqquest Error." + e );
    return ;
  }
}
