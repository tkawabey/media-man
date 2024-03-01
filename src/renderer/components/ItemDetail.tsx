import { Button, Stack, DropdownButton , Dropdown, Card, Col, Form, Row, Offcanvas   } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import React, { useState, useEffect } from "react";
import { useLocation, Link } from 'react-router-dom';
import { NavigateOptions, useNavigate, useParams  } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import {hasValue
  , getShortText
  , convertPathLocal2URL
  , getFavoriteTextKey
  , htmlElemDisp} from "../commonfunc"
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';


let g_procMsg:string[] = [];
let g_errMsg:string[] = [];


function ItemDetailPage() {

  // 多言語対応
  const { t } = useTranslation();

  const initialValues = {
    IID:0,
    PARENT_GID:0,
    Title: "",
    TitleShort: "",
    PlayTime:"",
    Year:0,
    Comment:"",
    FullPath:"",
    MediaExtInfo:"",
    PlayCount:0,
    ContentType:""
 };
 const videoValuesDef = {
  videoSource: "",
  videoMIME: ""
 };
  const audioValuesDef = {
  audioSource: "",
  audioMIME: ""
 };

 const initialDBProps = {
    ArtWork:""
 };

  const initDBPropErros:{ [key: string]: string } = {};


  const locationD = useLocation();
  const [breadCrunbs, setBreadCrunbs] = useState([]);
  const [formValues, setFormValues] = useState(initialValues);
  const [videoValues, setVideoValues] = useState(videoValuesDef);
  const [audioValues, setAudioValues] = useState(audioValuesDef);
  const [tags, setTags] = useState([]);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [favoriteTxt, setFavoriteTxt] = useState("");
  const [showExtInfo, setShowExtInfo] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // 削除確認画面
  const [showConfirm, setShowConfirm] = useState(false);
  const [linkedItems, setLinkedItems] = useState([]);

  const [dbPropValues, setDbPropValues] = useState(initialDBProps);
  const [dbPropErros, setdbPropErrors] = useState(initDBPropErros);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setError] = useState(false);

  const {id} = useParams();
  const navi = useNavigate();
  let bRendring : boolean = false;
  let uniq_key = 0;

  let  g_idList:[] = locationD.state.idList as [];


  //----------------------------------------------------------
  //
  // ページの読み込み時
  //
  //----------------------------------------------------------
  useEffect( () => {
    if( bRendring == false )
    {
      //console.log("in useEffect..Start");

      var audioCtrl:HTMLAudioElement = document.getElementById("audioCtrl") as HTMLAudioElement;
      var video  = document.getElementById("video") as HTMLVideoElement;
      // ボリュームが変更時の、コールバックを登録
      audioCtrl.removeEventListener("volumechange",volumechangeTrriger);
      audioCtrl.addEventListener("volumechange",volumechangeTrriger);
      video.removeEventListener("volumechange",volumechangeTrriger);
      video.addEventListener("volumechange",volumechangeTrriger);
      // メディアの末尾に達したために再生が停止した。の、コールバックを登録
      audioCtrl.removeEventListener("ended",playEndTrriger);
      audioCtrl.addEventListener("ended",playEndTrriger);
      video.removeEventListener("ended",videoPlayEndTrriger);
      video.addEventListener("ended",videoPlayEndTrriger);


      loading(parseInt("" + id! ), 0, "useEffect");
      //console.log("in useEffect..End");
    }
  }, [dbPropErros]);



  //----------------------------------------------------------
  //
  // ボリュームが変更された時に、コールされるコールバック
  //
  //----------------------------------------------------------
  async function volumechangeTrriger(event:any)
  {
    // ボリュームが変更された
    let e = event as any;
    await window.electron.doSetConfigValue("volume", "" + e.target.volume );
  }
  //----------------------------------------------------------
  //
  // AudioPlayが終了時に、コールされるコールバック
  //
  //----------------------------------------------------------
  async function  playEndTrriger(event:any)
  {
      // 次の曲へ。
      let e = event as any;
      //console.log("End Tigger Called. ID:", locationD.state.IID ) ;
      // 演奏回数をインクリメントする
      if( locationD.state.IID != undefined ) {
        await window.electron.incrementPlatCount(locationD.state.IID);
        await handleClickNextItem("" + locationD.state.IID);
      }
  }
  //----------------------------------------------------------
  //
  // VideoPlayが終了時に、コールされるコールバック
  //
  //----------------------------------------------------------
  async function videoPlayEndTrriger(event:any)
  {
    let e = event as any;
    //console.log("ended", e);
    if( locationD.state.IID != undefined ) {
      // 演奏回数をインクリメントする
      await window.electron.incrementPlatCount(locationD.state.IID);
      // 再生時刻のリセット
      await window.electron.doUpdItemAtCurrentTime(locationD.state.IID, 0);
    }
  }
  //----------------------------------------------------------
  //
  // VideoがPauseまたはSeekされた時に、コールされるコールバック
  //
  //----------------------------------------------------------
  async function videoSeekAndPauseTrriger(event:any)
  {
    let e = event as any;
    // 再生時刻を記録。　次回同じ時刻から、再生できるようにするため。
    if( locationD.state.IID != undefined ) {
      await window.electron.doUpdItemAtCurrentTime(locationD.state.IID, e.target.currentTime);
    }
  }
  //----------------------------------------------------------
  //
  //  前のアイテムを表示ボタンのonClickハンドラー
  //
  //----------------------------------------------------------
  const handleClickPrevItem = async (strId:string|undefined) => {

    let prevID = getGetPrevId( parseInt("" + strId) );
    if( prevID != -1 )
    {
      let opt:NavigateOptions = {
        state:{"idList":g_idList},
        replace:true
      };
      navi('/item/' + prevID, opt);
      // ロードし直す
      await loading(prevID, 0, "handleClickPrevItem");
    }
  }
  //----------------------------------------------------------
  //
  //  次のアイテムを表示ボタンのonClickハンドラー
  //
  //----------------------------------------------------------
  const handleClickNextItem =  async (strId:string|undefined) =>
  {
    //console.log("handleClickNextItem- strId", strId, "g_idList", g_idList);
    let nIID:number = parseInt(strId!);
    let nextId = getGetNextId( nIID );
    //console.log("nextId", nextId);
    if( nextId != -1 )
    {
      let opt:NavigateOptions = {
        state:{"idList":g_idList},
        replace:true
      };
      navi('/item/' + nextId, opt);
      // ロードし直す
      await loading(nextId, 0, "handleClickNextItem");
    }
  }
  //----------------------------------------------------------
  //
  // ページロード中の実装をここで、行います。
  //
  //----------------------------------------------------------
  async function loading(ID:number, callStack:number, who:string) {
    //console.log("Loading....", ID);
    setIsLoading( true );
    bRendring = true;
    let strName = "";
    let strNameShort = "";
    let strFilePath = "";
    let numVolume = 0.5;
    let breadCrunbD = await window.electron.doGetBreadcrumb("2", ""+ ID);
    let strVolume = await window.electron.doGetConfigValue("volume");
    let item = await window.electron.doGetItem(ID);
    let strMediaExtInfo:string = '';
    let itemReal = item;
    let PARENT_GID:number = item.PARENT_GID;

    if( item.linkItem != undefined ) {
      itemReal = item.linkItem;
    }
    console.log("item", item);
    console.log("itemReal", itemReal);

    g_idList = [];
    if( locationD.state != undefined )
    {
      if( locationD.state.idList != undefined )
      {
        g_idList = locationD.state.idList as [];
      }
    }

    // パンくずの設定
    breadCrunbD.pop(); //最後の要素（自身）を取り除きます。
    setBreadCrunbs(breadCrunbD);

    // 設定情報から、ボリュームを取得
    if( strVolume == "")
    {
      strVolume = "0.5";
    }
    numVolume = parseFloat(strVolume);


    if( itemReal != undefined ) {
      //console.log("item", item, "who", who);

      initialDBProps.ArtWork = itemReal.ArtWork;
      setDbPropValues(initialDBProps);

      // カレントのIIDを保存
      locationD.state.IID = item.IID;

      // お気に入りのテキストを設定
      setFavoriteTxt( t( getFavoriteTextKey(itemReal.Favorite) ) );

      // タイトルに表示する文字
      strName = itemReal.name;
      if( hasValue(itemReal.Title) == true ) {
        strName = itemReal.Title;
      }
      // ショート名。１５文字以上はカット
      strNameShort = getShortText(strName, 15);
//      console.log("strName", strName);

      // コンテンツのフルパス
      strFilePath = convertPathLocal2URL(itemReal.strFullPath);
      if( hasValue(itemReal.tags) == true )
      {
        setTags(itemReal.tags);
      } else {
        setTags([]);
        //タグの表示領域を日表
        htmlElemDisp(document.getElementById("item-info-content-tag"), false );
      }

      if( hasValue(itemReal.artists) == true )
      {
        setArtists(itemReal.artists);
      } else {
        setArtists([]);
        //アーティストの表示領域を日表
        htmlElemDisp(document.getElementById("item-info-content-artist"), false );
      }

      if( hasValue(itemReal.genres) == true )
      {
        setGenres(itemReal.genres);
      } else {
        setGenres([]);
        //  ジャンルの表示領域を日表
        htmlElemDisp(document.getElementById("item-info-content-genre"), false );
      }

      htmlElemDisp(document.getElementById("divVideo"), false );
      htmlElemDisp(document.getElementById("divAudio"), false );
      htmlElemDisp(document.getElementById("divImage"), false );


      if( hasValue(itemReal.ContentType) == true )
      {
        let mime:string =  itemReal.ContentType;

        if( mime.startsWith("video/")) {
          let currentTime:number = 0.0;

          if( hasValue(itemReal.CurrentTime) == true )
          {
            currentTime = itemReal.CurrentTime;
          }


          //document.getElementById("divVideo")!.style!.display = 'block';
          htmlElemDisp(document.getElementById("divVideo"), true);
            var video  = document.getElementById("video") as HTMLVideoElement;
            //video.addEventListener("waiting", (event) => {
            //});
            //video.addEventListener("stalled", (event) => {
            //});
            video.addEventListener("error", (event) => {
            });
            //video.addEventListener("canplay", (event) => {
            //});
            //video.addEventListener("suspend", (event) => {
            //});
            video.addEventListener("pause", videoSeekAndPauseTrriger );
            video.addEventListener("complete", (event) => {
              let e = event as any;
              console.log("complete", e);
            });
            video.addEventListener("progress", (event) => {
              let e = event as any;
              console.log("progress", e);
            });
            video.addEventListener("ratechange", (event) => {
              let e = event as any;
              console.log("ratechange", e);
            });
            video.addEventListener("seeked", videoSeekAndPauseTrriger );

            setVideoValues({
              videoSource:strFilePath,
              videoMIME:itemReal.ContentType
            });
            video.volume = numVolume; // 初期ボリューム
            video.currentTime = currentTime;
            video?.load();
        }
        if( mime.startsWith("audio/")) {
          //document.getElementById("divAudio")!.style!.display = 'block';
          htmlElemDisp(document.getElementById("divAudio"), true);

          // アルバムアートを設定
          var audioArdwork = document.getElementById("audioArdwork") as HTMLImageElement ;
          if( hasValue(itemReal.ArtWork) == true )
          {
            audioArdwork.src = convertPathLocal2URL(itemReal.ArtWork);
          }
          else
          {
            audioArdwork.src = "";
          }
          // Audioコントロールのソースを設定。
          var audioCtrl:HTMLAudioElement = document.getElementById("audioCtrl") as HTMLAudioElement;
          audioCtrl.volume = numVolume; // 初期ボリューム

          setAudioValues({
            audioSource:strFilePath,
            audioMIME:itemReal.ContentType
          });
          audioCtrl!.load();


        }
        if( mime.startsWith("image/")) {
          //document.getElementById("divImage")!.style!.display = 'block';
          htmlElemDisp(document.getElementById("divImage"), true);

          var imgArdwork = document.getElementById("imageArtdwork") as HTMLImageElement ;
          imgArdwork.src = strFilePath;
        }

        // メディア拡張情報の連想配列を、文字列に変換する。
        strMediaExtInfo = t("message.notExitMediExtInfo");
        if( itemReal.RawTags != undefined )
        {
          strMediaExtInfo = JSON.stringify(itemReal.RawTags, null , "\t");
        }
      }



      setFormValues({
        IID:ID,
        PARENT_GID:PARENT_GID,
        Title:strName,
        TitleShort:strNameShort,
        PlayTime:itemReal.PlayTime,
        Year:itemReal.Year,
        Comment:itemReal.Comment,
        FullPath:itemReal.strFullPath,
        MediaExtInfo:strMediaExtInfo,
        PlayCount:itemReal.PlayCount,
        ContentType:itemReal.ContentType
      });
      bRendring = false;
      setIsLoading( false );

      htmlElemDisp(document.getElementById("divLoading"), false);
      htmlElemDisp(document.getElementById("divLoaded"), true);

    }

  }

  //----------------------------------------------------------
  //
  // プロパティボタンのonClickハンドラー実装
  //
  //----------------------------------------------------------
  const handleClickProperty = async () => {

    var audioCtrl:HTMLAudioElement = document.getElementById("audioCtrl") as HTMLAudioElement;
    if( audioCtrl != undefined )
    {
      try {
        setAudioValues({
          audioSource:"",
          audioMIME:""
        });
        audioCtrl.load();
      } catch(e) {}
    }
    var video  = document.getElementById("video") as HTMLVideoElement;
    if( video != undefined )
    {
      try {
        setVideoValues({
          videoSource:"",
          videoMIME:""
        });
        video.load();
      } catch(e) {}
    }



    window.electron.doOpenProperty(formValues.FullPath);

    console.log("End doOpenProperty");
  }
  // 外部プログラムで、ファイルを開くのonClickハンドラー実装
  const handleClickOpenExternalPrg = async () => {
    window.electron.doOpenExternalPrg(formValues.FullPath);
  }
  //----------------------------------------------------------
  //
  // 前画面に戻るボタン
  //
  //----------------------------------------------------------
  const handleHistoryBack = async () => {
    navi(-1);
  }



  //----------------------------------------------------------
  //
  //
  //
  //----------------------------------------------------------
  function getGetNextId(curId:number):number
  {
    for(let i = 0; i < g_idList.length; i++ )
    {
      if( curId == g_idList[i] )
      {
        if( i == g_idList.length -1) {
          // リストの終端
          return -1;
        }
        return g_idList[i+1];
      }
    }
    return -1;
  }

  //----------------------------------------------------------
  //
  //
  //
  //----------------------------------------------------------
  function getGetPrevId(curId:number):number
  {
    let iPrevNo = -1;
    for(let i = 0; i < g_idList.length; i++ )
    {
      if( curId == g_idList[i] )
      {
        return iPrevNo;
      }
      iPrevNo = g_idList[i];
    }
    return -1;
  }

  //----------------------------------------------------------
  //
  // ジャンルの詳細画面に遷移
  //
  //----------------------------------------------------------
  async function handleGenreClick(TAG_ID:number)
  {
    navi('/genre/' + TAG_ID);
  }
  //----------------------------------------------------------
  //
  // タグの詳細画面に遷移
  //
  //----------------------------------------------------------
  async function handleTagClick(TAG_ID:number)
  {
    navi('/tag/' + TAG_ID);
  }

  //----------------------------------------------------------
  //
  // グループの詳細画面に遷移
  //
  //----------------------------------------------------------
  async function handleClickGroupDetail(GID:number)
  {
    navi('/group/' + GID);
  }

  //----------------------------------------------------------
  //
  //  お気に入りのドロップダウンコンボの、onClickハンドラー
  //
  //----------------------------------------------------------
  async function onClickFavorite(e:any, iFav:number)
  {
    let str:string = t( getFavoriteTextKey(iFav) );
    setFavoriteTxt(str);
    console.log("onClickFavorite", locationD.state.IID );
    if( locationD.state.IID != undefined)
    {
      await window.electron.updItemFavorite(locationD.state.IID, iFav);
    }
  }

  //----------------------------------------------------------
  //
  //  メディア情報の再取り込み
  //
  //----------------------------------------------------------
  async function handleClickReImport(IID:number)
  {
    let msg = await window.electron.doReImportItem(IID);
    if( msg != "" ) {
        alert(msg);
    } else {
      // 作成後は、リロードする。
      loading(IID, 0, "handleClickReImport");
    }
  }

  //----------------------------------------------------------
  //
  //  サムネイルの再作成
  //
  //----------------------------------------------------------
  async function handleClickMakeThumbnail(IID:number)
  {
    let msg = await window.electron.doMakeItemThumbnail(IID);
    if( msg != "" ) {
        alert(msg);
    } else {
      // 作成後は、リロードする。
      loading(IID, 0, "handleClickMakeThumbnail");
    }
  }

  //----------------------------------------------------------
  //
  //
  //
  //----------------------------------------------------------
  function makeHtml_Year(year:any)
  {
    if( year == undefined)
    {
      return (<></>);
    }
    else
    {
      return (<><span><em>{year}</em>{t("item.year")}</span></>);
    }
  }
  //----------------------------------------------------------
  //
  //
  //
  //----------------------------------------------------------
  function makeHtml_PlayTime(playTime:any)
  {
    if( playTime == undefined)
    {
      return (<></>);
    }
    else
    {
      return (<><span>{t("item.playTime")}:<em>{playTime}</em></span></>);
    }
  }
  //----------------------------------------------------------
  //
  //
  //
  //----------------------------------------------------------
  function makeHtml_PlayCount(playTime:any)
  {

    if( playTime == undefined ) {
      return (<></>);
    }
    let msg = t("message.PlayCount");
    msg = msg.replace("${PlayCount}", ""+playTime);
    return (<><span>{msg}</span></>);
  }


  //----------------------------------------------------------
  //
  //
  //
  //---------------------------------------------------------
  function makeHtml_DropdownMenuItem()
  {
    let mime:string =  formValues.ContentType;

    if( mime.startsWith("video/")) {
      return <>
        <Dropdown.Item href="#" onClick={ () => {setShowEdit(true); } } >{t("commands.propertyDb")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={ handleClickProperty }  >{t("commands.openPropertiy")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={ handleClickOpenExternalPrg }  >{t("commands.openExternalPrg")}</Dropdown.Item>



        <Dropdown.Item href="#" onClick={ () => handleClickReImport( formValues.IID) }  >メディア情報の再取り込み</Dropdown.Item>
        <Dropdown.Item href="#" onClick={ () => handleClickMakeThumbnail( formValues.IID) }  >サムネイル画像を作成</Dropdown.Item>


        <Dropdown.Item href="#" onClick={() => setShowExtInfo(true)}  >{t("commands.openMediaExtInfo")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={(e) => onClickDelMenu(e, formValues.IID)}  >{t("commands.delete")}</Dropdown.Item>
      </>;
    }
    if( mime.startsWith("audio/")) {
      return <>
        <Dropdown.Item href="#" onClick={ () => {setShowEdit(true); } } >{t("commands.propertyDb")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={ handleClickProperty }  >{t("commands.openPropertiy")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={ handleClickOpenExternalPrg }  >{t("commands.openExternalPrg")}</Dropdown.Item>

        <Dropdown.Item href="#" onClick={ () => handleClickReImport( formValues.IID) }  >メディア情報の再取り込み</Dropdown.Item>
        <Dropdown.Item href="#" onClick={ () => handleClickMakeThumbnail( formValues.IID) }  >サムネイル画像を作成</Dropdown.Item>


        <Dropdown.Item href="#" onClick={() => setShowExtInfo(true)}  >{t("commands.openMediaExtInfo")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={(e) => onClickDelMenu(e, formValues.IID)}  >{t("commands.delete")}</Dropdown.Item>
      </>;
    }
    if( mime.startsWith("image/")) {
      return <>
        <Dropdown.Item href="#" onClick={ handleClickProperty }  >{t("commands.openPropertiy")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={ handleClickOpenExternalPrg }  >{t("commands.openExternalPrg")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={ () => handleClickReImport( formValues.IID) }  >メディア情報の再取り込み</Dropdown.Item>
        <Dropdown.Item href="#" onClick={() => setShowExtInfo(true)}  >{t("commands.openMediaExtInfo")}</Dropdown.Item>
        <Dropdown.Item href="#" onClick={(e) => onClickDelMenu(e, formValues.IID)}  >{t("commands.delete")}</Dropdown.Item>
      </>;
    }
    return <></>;
  }


  //
  //----------------------------------------------------------
  //
  //    入力値の妥当性をチェックします。
  //
  //----------------------------------------------------------
  const validate = (values:any) => {
    const errors:any = {};
    // 現在破、チェックするもの無し。
    return errors;
  }
  //
  //----------------------------------------------------------
  //
  //    DBのプロパティーの更新
  //
  //----------------------------------------------------------
  async function onClickedDbPopSaveChange(e:any)
  {
    e.preventDefault();
    let errors:any = validate(dbPropValues);
    setdbPropErrors(errors);

    if( Object.keys(errors).length === 0 ) {
        //　エラー無しの場合、DBを更新して、ロードし直して画面の描画を最新にします。
        let updateObj = {
           ArtWork:dbPropValues.ArtWork
        };

        await window.electron.updItem( formValues.IID, updateObj );

        loading( formValues.IID, 0, "a" );

        // 編集画面を閉じます。
        setShowEdit(false);
    } else {
      // エラーの場合、テキストボックス等にセットし直し。
      setDbPropValues(dbPropValues);
    }
  }

  //
  //----------------------------------------------------------
  //
  //    画面のリロード
  //
  //----------------------------------------------------------
  const handleClickReload = async () => {
    window.location.reload();
  }
  //----------------------------------------------------------
  //
  //    削除
  //
  //----------------------------------------------------------
  const onClickDelMenu = async (e:any, IID:number) => {

    let result = await window.electron.getLinkedItems( IID );
    console.log(result);
    setLinkedItems(result);

    setShowConfirm( true );

  }
  const makeHtmlLinkdItem = () => {
    if( linkedItems.length == 0 ) {
      return <></>;
    }
    return <>
      <p>以下のファイルにリンクされていますが、リンク情報も削除されます。</p>
      <ul type="circle">
        {linkedItems.map( (linkedItem:any) => (
          <li>{linkedItem.FullPath}</li>
        ) )}
      </ul>
    </>;
  }
  const doDeleteItem = async (IID:number) => {
    var audioCtrl:HTMLAudioElement = document.getElementById("audioCtrl") as HTMLAudioElement;
    if( audioCtrl != undefined )
    {
      try {
        setAudioValues({
          audioSource:"",
          audioMIME:""
        });
        audioCtrl.load();
      } catch(e) {}
    }
    var video  = document.getElementById("video") as HTMLVideoElement;
    if( video != undefined )
    {
      try {
        setVideoValues({
          videoSource:"",
          videoMIME:""
        });
        video.load();
      } catch(e) {}
    }

    let result = await window.electron.delItem( IID );
    if( result.ret == false )
    {
      dbPropErros.Name = result.msg;
      return ;
    }


    navi('/group/' + formValues.PARENT_GID);
  }


  //----------------------------------------------------------
  //
  //
  //
  //----------------------------------------------------------


  return (
    <div className="content">
        <div id="divLoading" style={{display: 'block'}}>
          <div className="loading"><div className="loading-child"><p>Loading...</p></div></div>
        </div>
        <div id="divLoaded" style={{display: 'non'}}>
          {/*  パンくず */}
          <div key='key-breadcrumb'>
            <Breadcrumb>
              <Breadcrumb.Item href="/groups">Home</Breadcrumb.Item>
              {breadCrunbs.map( (breadCrunb:any) => (
              <Breadcrumb.Item href="#" onClick={ (e) => handleClickGroupDetail(breadCrunb.ID) } >{breadCrunb.TEXT}</Breadcrumb.Item>
              ) )}
              <Breadcrumb.Item active>{ getShortText(formValues.Title, 20) }</Breadcrumb.Item>
          </Breadcrumb>
          </div>

          {/*  パンくず直下のメニュー */}
          <Stack direction="horizontal" gap={3}>
            <Stack direction="horizontal" gap={2}>
              <Button variant="outline-secondary" onClick={ handleHistoryBack } >{<KeyboardDoubleArrowLeftIcon/>}</Button>
              <h4>{formValues.Title}</h4>
            </Stack>

            <Dropdown className="d-inline mx-2 ms-auto">
              <Dropdown.Toggle id="dropdown-autoclose-true" variant="outline-secondary">
                <SettingsApplicationsIcon/>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                {makeHtml_DropdownMenuItem()}
              </Dropdown.Menu>
            </Dropdown>
            <div className="vr" />
            {/*  リロード */}
            <Button variant="outline-secondary"  onClick={ handleClickReload }><RestartAltIcon/></Button>
          </Stack>


          <div>
            <p id="err-msg" className="errorMsg"></p>
            <p id="prcocces-msg"></p>
          </div>

          {/*  削除確認 */}
          <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
            <Modal.Header closeButton>
              <Modal.Title>{t("commonTitle.deleteComfirm")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>{t("message.delComfirm")}</p>
                {makeHtmlLinkdItem()}
                <p className="errorMsg">{dbPropErros.Name}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button  variant="primary" onClick={(e) => doDeleteItem(formValues.IID)}>{t("commands.delete")}</Button>
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              {t("commonTitle.close")}
              </Button>
            </Modal.Footer>
          </Modal>

          {/*  プログレスダイアログ */}
          <Modal show={showExtInfo} onHide={() => setShowExtInfo(false)}>
            <Modal.Header closeButton>
              <Modal.Title>{t("commonTitle.mediaExtInfo")}</Modal.Title>
            </Modal.Header>
            <Modal.Body><pre>{formValues.MediaExtInfo}</pre></Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowExtInfo(false)}>
              {t("commonTitle.close")}
              </Button>
            </Modal.Footer>
          </Modal>

          {/*  DBプロパティのOffCanvas */}
          <div key='db-prop-offcan'>
            <Offcanvas show={showEdit} onHide={() => setShowEdit(false)} placement="end">
              <Offcanvas.Header closeButton>
                <Offcanvas.Title>{t("commands.propertyDb")}</Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <Form id="formDbProp">
                  <Form.Group controlId="formFileSm" className="mb-3">
                    <Form.Label>ArtWork</Form.Label>
                    <Form.Control type="text" placeholder="Art work." key={dbPropValues.ArtWork} defaultValue={dbPropValues.ArtWork}
                      onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.ArtWork = value; setDbPropValues(dbPropValues);  } } />
                  </Form.Group>


                  <br />
                  <Form.Group controlId="formButton" className="mb-3" >
                    <div className='div-right'>
                    <Button variant="secondary" type="button"  onClick={() => setShowEdit(false)}  >Close</Button>
                    <Button variant="primary" type="submit" onClick={ (e) => onClickedDbPopSaveChange(e) } >Save changes</Button>
                    </div>
                  </Form.Group>

                </Form>
              </Offcanvas.Body>
            </Offcanvas>
          </div>



          <div  key='key-divVideo' id="divVideo" className='item-media-common'>
              <video  id="video" controls width="90%">
                <source src={videoValues.videoSource} type={videoValues.videoMIME}  />
              </video>
          </div>
          <div   key='key-divAudio' id="divAudio" className='item-media-common' >
            <div>
              <img id="audioArdwork" className='item-detail-item-audio-artwark' src=""></img>
            </div>
            <div>
              <Stack direction="horizontal" gap={5}>
                <div className='mx-auto' ></div>
                <Button variant="outline-secondary" onClick={ (e) => handleClickPrevItem(id) } >{<NavigateBeforeIcon/>}</Button>
                <audio controls id="audioCtrl" autoplay="true"   >
                    <source src={ audioValues.audioSource } type={ audioValues.audioMIME } />
                </audio>
                <Button key="prev-item" variant="outline-secondary" onClick={ (e) =>  handleClickNextItem(id) } >{<NavigateNextIcon/>}</Button>
                <div className='mx-auto' ></div>
              </Stack>
            </div>
          </div>
          <div   key='key-divImage' id="divImage" className='item-media-common'>
            <div>
              <Stack direction="horizontal" gap={3}>
                <Button variant="outline-secondary" onClick={ (e) => handleClickPrevItem(id) } >{<NavigateBeforeIcon/>}</Button>
                <img id="imageArtdwork" className="img-view" src=""></img>
                <Button key="prev-item" variant="outline-secondary" onClick={ (e) =>  handleClickNextItem(id) } >{<NavigateNextIcon/>}</Button>

              </Stack>
            </div>
            <div>

            </div>
          </div>
          <div   key='key-itemInfo' className="item-info">
            <div>

            </div>
            <div className="item-info-content">
              <div className="info">
                <div className="item item-detail-item-other">
                  <Stack direction="horizontal" gap={4}>
                    {makeHtml_PlayTime(formValues.PlayTime)}
                    {makeHtml_Year(formValues.Year)}
                    {makeHtml_PlayCount(formValues.PlayCount)}


                    <DropdownButton title={favoriteTxt} variant="outline-secondary" id="bg-nested-dropdown">
                      <Dropdown.ItemText>{t("commonTitle.setFavorite")}</Dropdown.ItemText>
                      <Dropdown.Item eventKey="fav-1" onClick={ (e) => { onClickFavorite(e,0); } }>{t("commonTitle.clear")}</Dropdown.Item>
                      <Dropdown.Item eventKey="fav-1" onClick={ (e) => { onClickFavorite(e,1); } }>{t("message.Favorite1")}</Dropdown.Item>
                      <Dropdown.Item eventKey="fav-2" onClick={ (e) => { onClickFavorite(e,25); } }>{t("message.Favorite2")}</Dropdown.Item>
                      <Dropdown.Item eventKey="fav-3" onClick={ (e) => { onClickFavorite(e,50); } }>{t("message.Favorite3")}</Dropdown.Item>
                      <Dropdown.Item eventKey="fav-4" onClick={ (e) => { onClickFavorite(e,75); } }>{t("message.Favorite4")}</Dropdown.Item>
                      <Dropdown.Item eventKey="fav-5" onClick={ (e) => { onClickFavorite(e,99); } }>{t("message.Favorite5")}</Dropdown.Item>
                    </DropdownButton>
                  </Stack>
                </div>
                <div   key='key-itemComment' className="item">
                  {formValues.Comment}
                </div>
                <div key='key-genres' className="item" id="item-info-content-genre">
                  {t("item.genre")}:
                  {genres.map( (genre:any) => (
                    <Link key={`genre${genre.id}`} to={`/genre/${genre.id}`}>{genre.name}</Link>
                  ) )}
                </div>
                <div key='key-items' className="item" id="item-info-content-tag">
                  {t("item.tag")}:
                  {tags.map( (tag:any) => (
                    <Link key={`tag${tag.id}`} to={`/tag/${tag.id}`}>{tag.name}</Link>
                  ) )}
                </div>
                <div key='key-artists' className="item" id="item-info-content-artist">
                  {t("item.artist")}:
                  {artists.map( (artist:any) => (
                    <Link key={`tag${artist.id}`} to={`/group/${artist.id}`}>{artist.name}</Link>
                  ) )}

                </div>
              </div>
            </div>

          </div>
          </div>
    </div>
  );
}

export default ItemDetailPage;
