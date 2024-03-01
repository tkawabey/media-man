import { ButtonGroup, Button, DropdownButton , Dropdown, Stack, Card, Col, Form, Row, Navbar, Offcanvas, Table   } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import React, { useState, useEffect } from "react";
import { Link, NavigateOptions, useNavigate, useParams  } from 'react-router-dom';
import Accordion from 'react-bootstrap/Accordion';
import Spinner from 'react-bootstrap/Spinner';
import { convertPathLocal2URL
  , getGropImagePath
  , getFavoriteTextKey
  , hasValue
  , htmlElemDisp
  , getShortText
  , getItemName

  , makeHtmlItemOfPlayTime
  , makeHtmlItemOfYear
  , makeHtmlItemOfYearEvaluation
  , makeHtmlItemOfTrack
  , makeHtmlItemOfOther
  , makeHtmlItemOfMediaType
  , makeHtmlItemOfLinkIcon
} from "../commonfunc"
import { useTranslation } from "react-i18next";
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import NotListedLocationIcon from '@mui/icons-material/NotListedLocation';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import noimage from '../../../assets/e_others_501.png'
import accessDeniedImage from '../../../assets/access_deny.png'
import linkErrorImage from '../../../assets/link_error.png'
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import CodeIcon from '@mui/icons-material/Code';

import LinkIcon from '@mui/icons-material/Link';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Alert from 'react-bootstrap/Alert';
import { integer } from 'aws-sdk/clients/cloudfront';


let g_procMsg:string[] = [];
let g_errMsg:string[] = [];


type SAME_GRP_DATA = {
  id: number;
  name: string;
  status: boolean;
};



// calling IPC exposed from preload script
window.electron.ipcRenderer.on('ipc-sendmsg-grp', (arg, msg) => {
    let proc:number = parseInt("" + arg);
    let strMsg = '';

    if( proc == 1 )
    {
      strMsg = 'proccessing...';
      htmlElemDisp(document.getElementById("progress-spinner"), true );
      htmlElemDisp(document.getElementById("modal-close-btn"), false );
      if( document.MyGetText != undefined) {
        strMsg = document.MyGetText("message.importing");
      }
      document.getElementById("prcocces-current")!.innerHTML = strMsg;
    }
    else if( proc == 0 || proc == -1 )
    {
      if( document.MyReloaded != undefined) {
        document.MyReloaded();
      }

      if( proc < 0 ) {
        g_errMsg.push("" + msg);
        strMsg = "Error, complete";
      }
      else
      {
        strMsg = "complete";
        if( document.MyGetText != undefined) {
          strMsg = document.MyGetText("message.complete");
        }
      }


      htmlElemDisp(document.getElementById("progress-spinner"), false );
      htmlElemDisp(document.getElementById("modal-close-btn"), true );
      document.getElementById("prcocces-current")!.innerHTML = strMsg;
    }
    else if( proc == 3 )
    {
      strMsg = "" + msg;
    }
    else if( proc < 0 )
    {
      g_errMsg.push("" + msg);
    }
    else
    {
      strMsg = "" + msg;
    }


    if( proc >= 2 )
    {
      if( g_procMsg.length > 5 )
      {
        g_procMsg.shift()
      }
      g_procMsg.push(strMsg);

      document.getElementById("prcocces-msg")!.innerHTML = g_procMsg.join("<br/>");
    }
    else
    {
      if( g_errMsg.length > 5 )
      {
        g_errMsg.shift()
      }
      document.getElementById("err-msg")!.innerHTML = g_errMsg.join("<br/>");
    }



  });


//--------------------------------------------------
//
//  フォルダーページ
//
//--------------------------------------------------
function GroupDetailPage() {
  const { t } = useTranslation();

  //-------------------------------
  // リスト表示データ
  //-------------------------------
  class ListItem
  {
    constructor(type: number, data: any) {
      this.type = type;
      this.data = data;
    }

    // ID
    getID() : number
    {
      if( this.type === 0 ) {
        return this.data.GID;
      }
      if( this.type === 1 ) {
        return this.data.IID;
      }
      return -1;
    }
    //　キー文字
    getKey() : string
    {
      if( this.type === 0 ) {
        return `group-${ this.getID() }`;
      }
      if( this.type === 1 ) {
        return `item-${ this.getID() }`;
      }
      return `key-${ this.getID() }`;
    }
    //　カードイメージ
    getCardImage()
    {
      if( this.type === 0 ) {
        let group = this.data;
        return getGropImagePath(group);
      }
      if( this.type === 1 ) {
        let item = this.data;
        if( item.linkItem != undefined ) {
          item = item.linkItem;
        } else {
          // linkErrorImage
          // リンクなのに、リンク情報がない場合は、　linkErrorImage　を返す。
          if( item.ext == "lnk")
          {
            return linkErrorImage;
          }
        }

        if( item.isCanAccsess == false )
        {
          // アクセス不可能イメージ
          return accessDeniedImage;
        }


        if( hasValue(item.ContentType) == false )
        {
          return  noimage;
        }
        if( item.ContentType.startsWith("image/") == true)
        {
          return  convertPathLocal2URL(item.strFullPath);
        }
        else{
          if( hasValue(item.ArtWork) == true )
          {
            return  convertPathLocal2URL(item.ArtWork);
          }
        }

        return  noimage;
      }
      return "";
    }
    //　絞り込みに使用する文字
    getQueryName() : string
    {
      if( this.type === 0 ) {
        let group = this.data;
        return group.SearchName;
      }
      if( this.type === 1 ) {
        let item = this.data;
        return item.Title;
      }
      return "";
    }
    //　タイトル
    getTitle() : string
    {
      if( this.type === 0 ) {
        let group = this.data;

        if( group.SearchName == undefined || group.SearchName == "" )
        {
          return group.Name;
        }
        if( group.SearchName.toLowerCase() == group.Name.toLowerCase() )
        {
          return group.Name;
        }
        return group.Name + "(" + group.SearchName + ")";
      }
      if( this.type === 1 ) {
        let item = this.data;
        return getShortText( getItemName(item), 50 );
      }
      return "???";
    }
    //　タイトルアイコン
    getTitleIcon()
    {
      if( this.type === 0 ) {
        let group = this.data;
        if( group.Kind == undefined || group.Kind == null )
        {
          return (<><NotListedLocationIcon className='image16'/></>);
        }
        if( group.Kind == 1 || group.Kind == 2 )
        {
          // images
          return (<><NotListedLocationIcon className='image16'/></>);
        }
        if( group.Kind == 3 )
        {
          // images
          return (<><AudiotrackIcon className='image16'/></>);
        }
        if( group.Kind == 4 )
        {
          // images
          return (<><OndemandVideoIcon className='image16'/></>);
        }
        return (<><NotListedLocationIcon className='image16'/></>);
      }
      if( this.type === 1 ) {
        let item = this.data;
        return makeHtmlItemOfMediaType(item);
      }
      return (<></>);
    }
    //　リンクアイコン
    getLinkIcon()
    {
      if( this.type === 1 ) {
        let item = this.data;
        return makeHtmlItemOfLinkIcon(item);
      }
      return (<></>);
    }
    //　コメント
    getComment()
    {
      if( this.type === 0 ) {
        let group = this.data;
        return getShortText(group.Comment, 15);
      }
      if( this.type === 1 ) {
        let item = this.data;
        if( item.linkItem != undefined ) {
          item = item.linkItem;
        }
        return getShortText(item.Comment, 15);
      }
      return '';
    }
    //　お気に入り
    getHtmlFavarit()
    {
      if( this.type === 0 ) {
        let group = this.data;

        if( group.Favorite == undefined || group.Favorite == null )
        {
          return (<></>);
        }
        return (<><FavoriteBorderIcon className='image16'/>   { t( getFavoriteTextKey(group.Favorite)) } </>);
      }
      if( this.type === 1 ) {
        let item = this.data;
        if( item.linkItem != undefined ) {
          item = item.linkItem;
        }

        if( item.Favorite == undefined || item.Favorite == null )
        {
          return (<></>);
        }
        return (<><FavoriteBorderIcon className='image16'/>  { t( getFavoriteTextKey(item.Favorite)) } </>);

      }
      return (<></>);
    }
    //　プレイタイム
    getHtmlPlayTime()
    {
      if( this.type === 0 ) {
        return (<></>);
      }
      if( this.type === 1 ) {
        let item = this.data;
        return makeHtmlItemOfPlayTime(item, t);
/*
        if( item.linkItem != undefined ) {
          item = item.linkItem;
        }
        if (item.PlayTime == null) {
          return (<></>);
        }
        return (
          <>
            <AccessTimeIcon className="image16" />
            {item.PlayTime}
          </>
        );
*/
      }
      return (<></>);
    }
    //　年
    getHtmlYear()
    {
      if( this.type === 0 ) {
        return (<></>);
      }
      if( this.type === 1 ) {
        let item = this.data;
        return makeHtmlItemOfYear(item);
      }
      return (<></>);
    }
    //　トラック
    getHtmlTrack()
    {
      if( this.type === 0 ) {
        return (<></>);
      }
      if( this.type === 1 ) {
        let item = this.data;
        return makeHtmlItemOfTrack(item);
      }
      return (<></>);
    }
    //　その他情報
    getHtmlOther()
    {
      if( this.type === 0 ) {
        return (<></>);
      }
      if( this.type === 1 ) {
        let item = this.data;
        return makeHtmlItemOfOther(item, t);
      }
      return (<></>);
    }
    //　カードのフッター情報
    getHtmlCardFooter()
    {
      if( this.type === 0 ) {
        return (<></>);
      }
      if( this.type === 1 ) {
        let item = this.data;
        return (
        <>
          <SaveAltIcon className='image16'/>:{ item.SID}  <CodeIcon className='image16'/>:{ item.mcode }
        </>);
      }
      return (<></>);
    }


    type: number; /// 0:group / 1:item
    data: any;    /// data.
  };

  // リストデータの初期値
  const initListData:ListItem[] = [];

  const initialValues = {
    PARENT_GID:-1,
    ID:0,
    GroupName: "",
    GroupImagePath:"",
    GroupComment:""
  };

  const initialDBProps = {
    Name:"",
    SearchName:"" ,
    Comment:"" ,
    Kind:0 ,
    SubKind:0 ,
    ArtWork:"",
    Strages:[],
    ConfKind:[],
    ConfSubKind:[],

    SaveSID:"",
    recurIntegrateGroup:false,
    recurMaster:false,
    recurKind:"",
    recurSubKind:""
  };

  const initQueryValues = {
    QStr:"",
    QFav:0,
    QFavStr:""
  };

  const initOrderValues = {
    OrderDisp:"---",
    OrderValue:""
  };
  const initDBPropErros:{ [key: string]: string } = {};

  const [listData, setListData] = useState(initListData);
  const [queryListData, setQueryListData] = useState(initListData);

  const [breadCrunbs, setBreadCrunbs] = useState([]);
  const [formValues, setFormValues] = useState(initialValues);
  const [dbPropValues, setDbPropValues] = useState(initialDBProps);
  const [dbPropErros, setdbPropErrors] = useState(initDBPropErros);
  const [queryValues, setQueryValues] = useState(initQueryValues);
  const [orderValues, setOrderValues] = useState(initOrderValues);

  const [parentGroups, setParentGroups] = useState( new Array<SAME_GRP_DATA> );
  const [parentFilterdGroups, setParentFilterdGroups] = useState( new Array<SAME_GRP_DATA> );
  const [extendCommands, setExtendCommands] = useState([]);
  const [sameParsons, setSameParsons] = useState([]);

  const [showAlart, setShowAlart] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSamePersonMng, setShowSamePersonMng] = useState(false);
  const [favoriteTxt, setFavoriteTxt] = useState("");

  const [textConfigJSON, setTextConfigJSON] = useState("");

  // フォルダーの追加ダイアログの表示
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [dataAddGroup, setDataAddGroup] = useState("");


  //
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [viewMode, setViewMode] = useState(0);  // 0:カード / 1:テーブル

  // インポートに関するデータ
  const [showSelectStrage, setShowSelectStrage] = useState(false);
  const [importFolder, setImportFolder] = useState("");
  const [selectedStrage, setSelectedStrage] = useState("");



  const {id} = useParams();
  const navi = useNavigate();


  // フォルダーセレクトからのコールバック
  window.electron.ipcRenderer.on('ipc-elected-folder', (arg, folder) => {
    try {
      let inputCtrl = document.getElementById("import-folder-name3");
      if( inputCtrl != null ) {
        (inputCtrl! as HTMLInputElement).value = "" + folder;
        setImportFolder("" + folder);
      }
    } catch(e) {
      console.log(e);
    }
  });


  //----------------------------------------------------------
  //
  // ページの読み込み時
  //
  //----------------------------------------------------------
  useEffect( () => {
    if( isLoading == false )
    {
      //console.log("id", id);
      if( id == undefined ) {
        loading("" + -1, 0);
      } else {
        loading(id!, 0);
      }
    }
  }, []);

  //----------------------------------------------------------
  //
  // ページロード中の実装をここで、行います。
  //
  //----------------------------------------------------------
  async function loading(ID:string, callStack:number) {
    setIsLoading( true );
    let listD:ListItem[] = [];
    let curID:number = parseInt(ID!);
    let strGroupName = "";
    let strGroupArtworkPath = "";
    let group = await window.electron.doGetGroup( curID );
    let breadCrunbD = await window.electron.doGetBreadcrumb("1", ID!);

    let setKind = await window.electron.doGetAppConfigKinds();
    let setSubKind = await window.electron.doGetAppConfigSubKinds();
    let queryData = await window.electron.doGetCookieQueryData(0, curID);



    let queryDataFavorite = 0;
    let queryDataQueryTitle = "";
    if( queryData != undefined )
    {
      queryDataFavorite = queryData.Favorite;
      queryDataQueryTitle = queryData.QueryTitle;
    }

    let strSavingSID =  await window.electron.getGroupSaveSID(curID);


    // 絞り込み情報のリセット
    var elmIQT:HTMLInputElement|null  = document.getElementById('input-query-text') as HTMLInputElement;
    if( elmIQT != null ) { elmIQT.value = queryDataQueryTitle; }
    setQueryValues(
      {
        QStr:queryDataQueryTitle,
        QFav:queryDataFavorite,
        QFavStr:t( getFavoriteTextKey(queryDataFavorite) )
      }
    );
    // 並び替え
    setOrderValues({
      OrderDisp:"---",
      OrderValue:""});


    // パンくずの設定
    breadCrunbD.pop(); //最後の要素（自身）を取り除きます。
    setBreadCrunbs(breadCrunbD);

    if( group == undefined )
    {
      alert('Get Group error!!');
      return;
    }

    if( curID === -1 &&  group.subgroupsArray.length == 0 )
    {
      // ルートフォルダーかつ、表示アイテムがない場合は、ストレージ画面へ遷移
      navi('/strages');
      return ;
    }






    // 同一人物
    htmlElemDisp(document.getElementById("info-content-same-pearsons"), group.sameGrps != undefined );
    if( group.sameGrps != undefined ) {
      setSameParsons(group.sameGrps);
    } else {
      setSameParsons([]);
    }
    // 同一人物、表示データを作成。
    if( curID !== -1 )
    {
      let lsimpeGrps = await window.electron.doLoadGroupsSimple(group.PARENT_GID);
      let newSetData:SAME_GRP_DATA[] = [];

      for(let i = 0; i < lsimpeGrps.length; i++ )
      {
        if( lsimpeGrps[i].id !== group.GID ) {
          let bSelect:boolean = false;
          if( group.sameGrps != undefined )
          {
              for(let j = 0; j < group.sameGrps.length; j++ )
              {
                if( group.sameGrps[j].id === lsimpeGrps[i].id )
                {
                  bSelect = true;
                  break;
                }
              }
          }
          newSetData.push( {id:lsimpeGrps[i].id, name:lsimpeGrps[i].name, status:bSelect} );
        }
      }

      setParentGroups( newSetData );
      setParentFilterdGroups( newSetData );
    }




    // 拡張コマンド
    let extCommand = await window.electron.doGetExtendCommandMenuGroup(group.Kind, group.SubKind) ;
    if( extCommand != undefined ) {
      setExtendCommands(extCommand as any);
    }


    strGroupName = group.Name;
    if( group.SearchName != undefined )
    {
      if( group.Name.toLowerCase() != group.SearchName.toLowerCase()  )
      {
        strGroupName = group.Name;
        strGroupName += "(";
        strGroupName += group.SearchName;
        strGroupName += ")";
      }
    }
    strGroupArtworkPath = getGropImagePath(group);

    setFormValues(
      {
        PARENT_GID:group.PARENT_GID,
        ID:curID,
        GroupName:strGroupName,
        GroupImagePath:strGroupArtworkPath,
        GroupComment:group.Comment,
      }
    );
    initialDBProps.Name = group.Name;
    initialDBProps.SearchName = group.SearchName;
    initialDBProps.Comment = group.Comment;
    initialDBProps.Kind = group.Kind;
    initialDBProps.SubKind = group.SubKind;
    initialDBProps.ArtWork = group.ArtWork;
    initialDBProps.Strages = group.strages;
    initialDBProps.ConfKind = setKind;
    initialDBProps.ConfSubKind = setSubKind;
    initialDBProps.SaveSID = strSavingSID;

    if( hasValue(group.ConfigJson) ) {
      try
      {
        let jsonData = JSON.parse( group.ConfigJson );
        if( jsonData != undefined ) {

          delete jsonData.name;
          delete jsonData.searchName;
          delete jsonData.kind;
          delete jsonData.subKind;
          delete jsonData.favorite;
          delete jsonData.comment;
          delete jsonData.samePearsons;
          delete jsonData.artWork;

          if( jsonData.recurIntegrateGroup != undefined ) {
            initialDBProps.recurIntegrateGroup = jsonData.recurIntegrateGroup;
            delete jsonData.recurIntegrateGroup;
          }
          if( jsonData.recurMaster != undefined ) {
            initialDBProps.recurMaster = jsonData.recurMaster;
            delete jsonData.recurMaster;
          }
          if( jsonData.recurKind != undefined ) {
            initialDBProps.recurKind = jsonData.recurKind;
            delete jsonData.recurKind;
          }
          if( jsonData.recurSubKind != undefined ) {
            initialDBProps.recurSubKind = jsonData.recurSubKind;
            delete jsonData.recurSubKind;
          }


          setTextConfigJSON( JSON.stringify(jsonData, null , "\t") );
        }
      } catch( e ){

      }
    }
    setDbPropValues(initialDBProps);


    for(let subgroup of group.subgroupsArray )
    {
      listD.push( new  ListItem(0, subgroup) );
    }
    for(let fileD of group.files )
    {
      if( hasValue(fileD.Title) == false ) {
        fileD.Title = fileD.name;
      }
      listD.push( new  ListItem(1, fileD) );
    }
    setListData(  listD );
    setQueryListData( listD.filter((l:ListItem) =>
          l.getQueryName().toLowerCase().startsWith(queryDataQueryTitle) && l.data.Favorite >= queryDataFavorite
      )
    );

    setFavoriteTxt( t( getFavoriteTextKey(group.Favorite) ) );

    setIsLoading( false );

    // 初期登録の場合、更新日時が、undefinedになっています。
    // undefinedの場合、子アイテムをインポートします。
    if( group.LatestCheck == undefined && callStack == 0 )
    {
      // 読み込み完了時に、リロードす関数を作成
      document.MyReloaded = function()
      {

        setShowAlart(false);
        loading(ID, 1 );
      };
      document.MyGetText = function(txt:string)
      {
        return t(txt);
      };


      g_procMsg = [];
      g_errMsg = [];

      setShowAlart(true);

      window.electron.ipcRenderer.sendMessage('ipc-sendmsg-grp', [ID]);
    }

  }
  function setInnerHTML(obj:any, text:string)
  {
    if( obj == undefined ) {
      return;
    }
    if( obj.innerHTML == undefined ) {
      return;
    }
    obj.innerHTML = text;
  }
  // フォルダーの詳細画面に遷移
  async function handleClickGroupDetail(GID:number)
  {
    // Historyに貯めて、
    let opt:NavigateOptions = {
      preventScrollReset:true
    };
    navi('/group/' + GID, opt);
    // ロードし直す
    loading("" + GID, 0);
  }
  // 詳細画面に遷移
  async function handleDetailClick2(type:number, ID:number)
  {
    if( type === 0 )
    {
      // Historyに貯めて、
      let opt:NavigateOptions = {
        preventScrollReset:true
      };
      navi('/group/' + ID, opt);
      // ロードし直す
      loading("" + ID, 0);
    } else
    if( type === 1 )
    {
      let idList = [];
      for(let listD of listData )
      {
        if( listD.type === 1 )
        {
          idList.push(listD.getID());
        }
      }

      let opt:NavigateOptions = {
        state:{"idList":idList},
        replace:false,
        preventScrollReset:true
      };
      navi('/item/' + ID, opt);
    }
  }

  // 前画面に戻るボタン
  const handleClickHistoryBack = async () => {
    navi(-1);
    if( formValues.PARENT_GID != -1 ) {
      loading("" + formValues.PARENT_GID, 0 );
    }

  }
  // 画面のリロード
  const handleClickReload = async () => {
    window.location.reload();
  }
  // 情報の再取り込み
  const reImport = async () => {

    // 読み込み完了時に、リロードす関数を作成
    document.MyReloaded = function()
    {
      setShowAlart(false);
      loading("" + formValues.ID, 1 );
    };
    document.MyGetText = function(txt:string)
    {
      return t(txt);
    };

    g_procMsg = [];
    g_errMsg = [];

    setShowAlart(true);

    window.electron.ipcRenderer.sendMessage('ipc-sendmsg-grp', [formValues.ID]);

    //window.location.reload();
    return true;
  }


  // 同一人物DLGからの、フォルダー名絞り込みテキストボックスの変更通知ハンドラー
  function  searchSameGroupHandleChange(e:any)
  {
    const { name, value } = e.target;

    let strSeach = value.toLowerCase();

    setParentFilterdGroups( parentGroups.filter((l:SAME_GRP_DATA) =>
          l.name.toLowerCase().startsWith(strSeach)
      )
    );
  }

  //  お気に入りのドロップダウンコンボの、onClickハンドラー
  async function onClickFavorite(e:any, iFav:number)
  {
    let str:string = t( getFavoriteTextKey(iFav) );
    setFavoriteTxt(str);
    await window.electron.updGroupFavorite(formValues.ID, iFav);
  }
  // Inputのchangeコールバック
  function  searchGroupHandleChange(e:any)
  {
    const { name, value } = e.target;

    let strSeach = value.toLowerCase();

    setQueryListData( listData.filter((l:ListItem) =>
          l.getQueryName().toLowerCase().startsWith(strSeach) && l.data.Favorite >= queryValues.QFav
      )
    );

    setQueryValues(
      {
        QStr:value,
        QFav:queryValues.QFav,
        QFavStr:queryValues.QFavStr
      }
    );


    // Cookie にクエリー情報を保存します。
    window.electron.doSetCookieQueryData(0, formValues.ID, queryValues.QFav, value );

    return true;
  }
  //  お気に入りによる絞り込み、ドロップダウンコンボの、onClickハンドラー
  async function onClickQueryFavorite(e:any, iFav:number)
  {
    let strSeach = queryValues.QStr.toLowerCase();
    //フィルタリング機能
    setQueryListData( listData.filter((l:ListItem) =>
        l.getQueryName().toLowerCase().startsWith(strSeach) && l.data.Favorite >= iFav
     )
    );
    setQueryValues(
      {
        QStr:queryValues.QStr,
        QFav:iFav,
        QFavStr:t( getFavoriteTextKey(iFav) )
      }
    );

    // Cookie にクエリー情報を保存します。
    window.electron.doSetCookieQueryData(0, formValues.ID, iFav, queryValues.QStr );
  }


  //  並び替え、ドロップダウンコンボの、onClickハンドラー
  async function onClickOrder(e:any, strOrder:string)
  {
    let strDispName:string = "";
    let sortedListData:ListItem[]  =
       listData.sort( function(first:ListItem, second:ListItem){
      if( strOrder === 'Name' ) {
        if( first.data.Name > second.data.Name ) {
          return 1;
        }
        if( first.data.Name < second.data.Name ) {
          return -1;
        }
        return 0;
      }
      if( strOrder === 'Favorite' ) {
        if( first.data.Favorite > second.data.Favorite ) {
          return -1;
        }
        if( first.data.Favorite < second.data.Favorite ) {
          return 1;
        }
        return 0;
      }
      if( strOrder === 'Year' ) {


        if( first.data.Year > second.data.Year ) {
          return 1;
        }
        if( first.data.Year < second.data.Year ) {
          return -1;
        }
        return 0;
      }
      if( strOrder === 'Title' ) {
        if( first.data.Title > second.data.Title ) {
          return 1;
        }
        if( first.data.Title < second.data.Title ) {
          return -1;
        }
        return 0;
      }
      if( strOrder === 'Track' ) {
        if( first.data.Track > second.data.Track ) {
          return 1;
        }
        if( first.data.Track < second.data.Track ) {
          return -1;
        }
        return 0;
      }
      return 0;
    } );

    let strSeach = queryValues.QStr.toLowerCase();
    setListData( sortedListData );
    setQueryListData( sortedListData.filter((l:ListItem) =>
          l.getQueryName().toLowerCase().startsWith(strSeach) && l.data.Favorite >= queryValues.QFav
      )
    );


    if( strOrder === 'Name' ) {
      strDispName = t("commonTitle.orderDispName");
    }
    if( strOrder === 'Favorite' ) {
      strDispName = t("commonTitle.orderDispFavorite");
    }
    if( strOrder === 'Year' ) {
      strDispName = t("commonTitle.orderDispYear");
    }
    if( strOrder === 'Title' ) {
      strDispName = t("commonTitle.orderDispTitle");
    }
    if( strOrder === 'Track' ) {
      strDispName = t("commonTitle.orderDispTrack");
    }
    // 並び替え
    setOrderValues({
      OrderDisp:strDispName,
      OrderValue:strOrder});
  }


  // 入力値の妥当性をチェックします。
  const validate = (values:any) => {
    const errors:any = {};
    if (!values.Name) {
      errors.Name = "Nameを入力してください。";
    }
    if (!values.SearchName) {
      errors.SearchName = "SearchNameを入力してください。";
    }
    return errors;
  }

  // DBのプロパティーの更新
  async function onClickedDbPopSaveChange(e:any)
  {
    e.preventDefault();

    let errors:any = validate(dbPropValues);
    let objConfigJson:any = {};


    // その他データを編集
    try {
      if( hasValue(textConfigJSON) ) {
        objConfigJson = JSON.parse(textConfigJSON);
      }

      //
      if( dbPropValues.recurIntegrateGroup == true )
      {
        objConfigJson.recurIntegrateGroup = true;
      }
      if( dbPropValues.recurMaster == true )
      {
        objConfigJson.recurMaster = true;
      }
      if( dbPropValues.recurKind  != "" )
      {
        objConfigJson.recurKind = dbPropValues.recurKind;
      }
      if( dbPropValues.recurSubKind  != "" )
      {
        objConfigJson.recurSubKind = dbPropValues.recurSubKind;
      }


    } catch( ex ) {
      errors.ConfigJson = "" + ex;
    }
    setdbPropErrors(errors);
    if( Object.keys(errors).length === 0 ) {
        //　エラー無しの場合、DBを更新して、ロードし直して画面の描画を最新にします。
        let updateObj = {
            Name:dbPropValues.Name
          , SearchName:dbPropValues.SearchName
          , Comment:dbPropValues.Comment
          , Kind:dbPropValues.Kind
          , SubKind:dbPropValues.SubKind
          , ArtWork:dbPropValues.ArtWork
        };

        await window.electron.updGroup( formValues.ID, updateObj, objConfigJson );

        loading("" + formValues.ID, 0 );

        // 編集画面を閉じます。
        setShowEdit(false);
    } else {
      // エラーの場合、テキストボックス等にセットし直し。
      setDbPropValues(dbPropValues);
    }
  }


  // Group追加の入力値の妥当性をチェックします。
  const validateAddGroup = async  (groupName:any) => {
    const errors:any = {};

    if (!groupName) {
      errors.Name = "Nameを入力してください。";
      return errors;
    }
    for(let strKey in dbPropValues.Strages )
    {
      // 既に同フォルダーがないか確認します。
      let strage = dbPropValues.Strages[strKey];
      let ret = await window.electron.canAddGroup(strage, groupName);
      if( ret.ret < 0 )
      {
        if( ret.ret == -1 )
        {
          errors.Name = `${strage}に現在アクセスできません。`;
        }
        else
        if( ret.ret == -2 )
        {
          errors.Name = `${groupName}は既に存在します。`;
        }
        else
        {
          errors.Name = `${strage}のチェック処理でエラーが発生しました。`;
        }
        return errors;
      }
    }
    return errors;
  }
  // Groupの追加
  async function onClickedAddGroup(e:any)
  {
    e.preventDefault();

    let errors:any = await validateAddGroup(dataAddGroup);
    setdbPropErrors(errors);
    if( Object.keys(errors).length === 0 ) {

      let ret = await window.electron.addGroup(formValues.ID,  Object.values(dbPropValues.Strages) , dataAddGroup);
      if( ret.ret == undefined )
      {
        errors.Name = ret.msg;
        setdbPropErrors(errors);
        return ;
      }

      let listD:ListItem[] = [];
      listD.push(new ListItem(0, ret.ret) );
      for(let lD of listData )
      {
        listD.push( lD );
      }
      setListData(listD);
      setQueryListData(listD);

      setShowAddGroup(false);
    }
  }

  // 指定されたストレージを開く
  async function onClickedStrageOpen(e:any, strage:any)
  {
    e.preventDefault();

    window.electron.doOpenExternalPrg(strage);
  }

  // 指定されたストレージを開く
  async function onClickedExtendCommand(e:any, commandName:any)
  {
    e.preventDefault();

    g_procMsg = [];
    g_errMsg = [];

    setShowAlart(true);
    setInnerHTML(document.getElementById("prcocces-msg"), "");
    setInnerHTML(document.getElementById("err-msg"), "");

    window.electron.ipcRenderer.sendMessage('ipc-sendmsg-grp', [formValues.ID, commandName]);
  }
  // 同一人物管理
  async function onClickedUpdateSamePearson(e:any)
  {
      let grelationIDs:number[] = [];
      for(let person of parentGroups )
      {
/*
        let checkbox:HTMLInputElement  = document.getElementById(`idSameParson_${person.id}`) as HTMLInputElement;
        if( checkbox != undefined )
        {
          if( checkbox!.checked == true ) {
            grelationIDs.push(person.id);
          }
        }
*/
        if( person.status == true ) {
          grelationIDs.push(person.id);
        }
      }

      await window.electron.updGRelation(formValues.ID, grelationIDs);

      loading("" + formValues.ID, 0 );

      setShowSamePersonMng(false);
  }

  // 表示の切り替え 0:カード表示  1:テーブル表示
  async function onChangeViewStyle(iViewMode:integer) {
    setViewMode( iViewMode );
  }


  // 　インポート
  async function onClickImport(e:any)
  {
    e.preventDefault();

    if( Object.keys(dbPropErros).length != 0 ) {
      setdbPropErrors({});
    }
    setImportFolder("");
    setSelectedStrage("");
    setShowSelectStrage(true);
  }
  // インポートするターゲットを設定するために、フォルダー選択ダイアログを開きます
  async function onSelectImportTargetFolder()
  {
    window.electron.ipcRenderer.sendMessage('ipc-elected-folder', []);
  }
  async function onClosedSelectStrage(e:any)
  {
    const errors:any = {};
    //console.log("importFolder   :" + importFolder);
    //console.log("selectedStrage :" + selectedStrage);
    if( importFolder.length == 0 ) {
      errors.importFolder = "入力されていません";
    }
    if( selectedStrage.length == 0 ) {
      errors.selectedStrage = "指定されていません";
    }

    if( Object.keys(errors).length != 0 ) {
      setdbPropErrors(errors);
      return ;
    }
    setShowSelectStrage( false );


    // プロセッシングダイアログを表示
    g_procMsg = [];
    g_errMsg = [];
    setInnerHTML(document.getElementById("prcocces-msg"), "");
    setInnerHTML(document.getElementById("err-msg"), "");
    setShowAlart(true);

    // mainプロセスにインポートの実行指示
    window.electron.ipcRenderer.sendMessage('ipc-import-ex', [formValues.ID, importFolder, selectedStrage]);
  }

  // 重複チェック
  async function onDupCheck(e:any)
  {
    e.preventDefault();

    // プロセッシングダイアログを表示
    g_procMsg = [];
    g_errMsg = [];
    setInnerHTML(document.getElementById("prcocces-msg"), "");
    setInnerHTML(document.getElementById("err-msg"), "");
    setShowAlart(true);

    // mainプロセスにインポートの実行指示
    window.electron.ipcRenderer.sendMessage('ipc-dup-check', [formValues.ID]);
  }

  // 設定情報を保存するSIDを変更する
  async function onChangeSavingSID(sid:string)
  {
    console.log("sid", sid);
    await window.electron.changeGroupSaveSID(formValues.ID, sid);
  }

  function makeHTMLHomePane()
  {
    if( formValues.ID == -1 ) {
      // Root(Home)の場合
      return (<></>);
    } else {

      return (<>


        {/*  パンくず */}
        <div>
          <Breadcrumb>
            <Breadcrumb.Item href="/groups">Home</Breadcrumb.Item>
            {breadCrunbs.map( (breadCrunb:any) => (
            <Breadcrumb.Item href="#" onClick={ (e) => handleClickGroupDetail(breadCrunb.ID) } >{breadCrunb.TEXT}</Breadcrumb.Item>
            ) )}
            <Breadcrumb.Item active>{formValues.GroupName}</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        {/*  パンくず直下のメニュー */}
        <Stack direction="horizontal" gap={3}>

          {/*  ヒストリーバック */}
          <Stack direction="horizontal" gap={2}>
            <Button  variant="outline-secondary" onClick={ handleClickHistoryBack } >{<KeyboardDoubleArrowLeftIcon/>}</Button>
            <h4>{formValues.GroupName}</h4>
          </Stack>


          <Dropdown className="d-inline mx-2 ms-auto">
            <Dropdown.Toggle id="dropdown-autoclose-true" variant="outline-secondary">
              <SettingsApplicationsIcon/>
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item eventKey="1" href="#" onClick={ () => {setShowEdit(true); } } >{t("commands.propertyDb")}</Dropdown.Item>
              <Dropdown.Item eventKey="2" href="#" onClick={ reImport }  >{t("commands.reImport")}</Dropdown.Item>

              <Dropdown.Item eventKey="3" href="#" onClick={ () => {setShowAddGroup(true); } } >{t("commands.addFolder")}</Dropdown.Item>

              <Dropdown.Divider />
              <Dropdown.Item eventKey="4" href="#" onClick={ () => {onChangeViewStyle(0); } } active={viewMode === 0} >{t("commands.viewModeCard")}</Dropdown.Item>
              <Dropdown.Item eventKey="5" href="#" onClick={ () => {onChangeViewStyle(1); } } active={viewMode === 1} >{t("commands.viewModeTable")}</Dropdown.Item>

              <Dropdown.Divider />
              <Dropdown.Item eventKey="6" href="#" onClick={ (e) => {onClickImport(e)} }  >{t("commands.importEx")}</Dropdown.Item>
              <Dropdown.Item eventKey="7" href="#" onClick={ (e) => {onDupCheck(e)} }  >重複チェック</Dropdown.Item>
              <Dropdown.Item eventKey="9" href="#" onClick={ () => {setShowSamePersonMng(true)} }  >{t("commands.samePrarson")}</Dropdown.Item>


              <Dropdown.Divider />
              { Object.values( dbPropValues.Strages).map( (strage:any) => (
                      <Dropdown.Item  eventKey={ `strage-${ strage }` } href="#" onClick={(e) => { onClickedStrageOpen(e, strage ) }}  >{ strage }</Dropdown.Item>
                  ) )
              }
              <Dropdown.Divider />
              {/*  拡張コマンド  extendCommands */}
              {extendCommands.map( (extCommand:any) => (
                  <Dropdown.Item href="#" onClick={  (e) => {onClickedExtendCommand(e, extCommand.CommandName); }  }  >{extCommand.Name}</Dropdown.Item>
              ) )}
            </Dropdown.Menu>
          </Dropdown>
          <div className="vr" />
          {/*  リロード */}
          <Button variant="outline-secondary"  onClick={ handleClickReload }><RestartAltIcon/></Button>
        </Stack>



        {/*  フォルダーのその他情報 */}
        <Stack className="group-summary" direction="horizontal" gap={2}>
          <img className='Title-img' src={formValues.GroupImagePath}></img>

          <Stack className="group-summary" direction="horizontal" gap={2}>
            <Stack direction="vertical" gap={2}>
              <Stack direction="horizontal" gap={2}>
                  <DropdownButton title={favoriteTxt} variant="outline-secondary" id="bg-nested-dropdown">
                    <Dropdown.ItemText>{t("commonTitle.setFavorite")}</Dropdown.ItemText>
                    <Dropdown.Item eventKey="fav-0" onClick={ (e) => { onClickFavorite(e,0); } }>{t("commonTitle.clear")}</Dropdown.Item>
                    <Dropdown.Item eventKey="fav-1" onClick={ (e) => { onClickFavorite(e,1); } }>{t("message.Favorite1")}</Dropdown.Item>
                    <Dropdown.Item eventKey="fav-2" onClick={ (e) => { onClickFavorite(e,25); } }>{t("message.Favorite2")}</Dropdown.Item>
                    <Dropdown.Item eventKey="fav-3" onClick={ (e) => { onClickFavorite(e,50); } }>{t("message.Favorite3")}</Dropdown.Item>
                    <Dropdown.Item eventKey="fav-4" onClick={ (e) => { onClickFavorite(e,75); } }>{t("message.Favorite4")}</Dropdown.Item>
                    <Dropdown.Item eventKey="fav-5" onClick={ (e) => { onClickFavorite(e,99); } }>{t("message.Favorite5")}</Dropdown.Item>
                  </DropdownButton>



                  <div key='key-same-pearsons' className="same-pearsons" id="info-content-same-pearsons">
                    { sameParsons.length != 0 ? t("group.samePerson") + `:` : `` }
                    {sameParsons.map( (sameParson:any) => (
                      <><a key={`sameParson_${sameParson.id}`} onClick={ (e) => handleClickGroupDetail(sameParson.id) } href="#">{sameParson.name}</a><span>   </span></>
                    ) )}
                  </div>
              </Stack>
              <p>{formValues.GroupComment}</p>
            </Stack>
          </Stack>
        </Stack>


      </>);
    }
  }

  function makeHTMLList()
  {
    if( viewMode === 0 )
    {
      return (<>


        {/* アイテムの一覧リスト　 */}
        <div key='list-items' className="d-flex flex-wrap ItemList">
         {queryListData.map( (listD:ListItem) => (
          <div key={ listD.getKey() } className="onCard"
                onClick={ (e) => handleDetailClick2(listD.type,  listD.getID()) }>
              <Card style={{ width: '18rem' }} className='item-card'>

                <Card.Body>
                  <Stack direction="horizontal" gap={2}>
                    <Card.Img  className="GroupList-img" src={ listD.getCardImage() } />

                    <Stack direction="vertical" gap={3}>

                      <Stack direction="horizontal" gap={2}>
                        <div >{ listD.getHtmlPlayTime() }</div>
                        <div className="ms-auto">{listD.getHtmlYear() }</div>
                      </Stack>


                      <Stack direction="horizontal" gap={1}>
                        <div>{listD.getHtmlOther()}</div>
                      </Stack>

                      <Stack direction="horizontal" gap={2}>
                        <div >{listD.getHtmlFavarit()}</div>
                        <div className='div-center'></div>
                      </Stack>
                    </Stack>


                  </Stack>
                  <Card.Subtitle className="mb-2 text-muted">{listD.getLinkIcon()}{listD.getTitleIcon()}{ listD.getTitle() }</Card.Subtitle>
                  <Card.Text>{ listD.getComment() }</Card.Text>
                  <Card.Footer>
                    {listD.getHtmlCardFooter()}
                  </Card.Footer>
                </Card.Body>
              </Card>
          </div>
         ) )}
        </div>

      </>);
    }
    if( viewMode === 1 )
    {
      return (<>
        <div className="todos" id='idSearchResult'>
          <Table striped bordered hover variant="light">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Comment</th>
              <th>Favarit</th>
              <th>----</th>
            </tr>
          </thead>
          <tbody>
          {queryListData.map( (listD:ListItem) => (
            <>
              <tr key={ listD.getKey() }  onClick={ (e) => handleDetailClick2(listD.type,  listD.getID()) }>
                <td>{listD.getLinkIcon()}{listD.getTitleIcon()}</td>
                <td>{ listD.getTitle() }</td>
                <td>{ listD.getComment() }</td>
                <td><div >{listD.getHtmlFavarit()}</div></td>
                <td><div >{listD.getHtmlOther()}{ listD.getHtmlPlayTime() }{listD.getHtmlYear() }</div></td>
              </tr>
            </>
          ) )}
          </tbody>
        </Table>
        </div>
      </>
      );
    }
    return (<></>)
  }

  function makeHTMLFilterText()
  {

    return <>:{queryValues.QFavStr}/{queryValues.QStr}    </>;
  }
  // Same GroupのcheckboxのonChangeイベントハンドラー
  function onChangeSameGrpCheckBox(person_id:integer, v:any)
  {
    console.log("onChangeSameGrpCheckBox:" + person_id + "  checked:" + v.checked);

    for(let person of parentGroups)
    {
      if( person.id == person_id)
      {
        person.status = v.checked;
        break;
      }
    }
  }


  if( isLoading == true ) {
    return (<div className="loading"><div className="loading-child"><p>Loading...</p></div></div>);
  }


  return (
    <div className="content">
        {makeHTMLHomePane()}


        {/*  プログレスダイアログ */}
        <div key='progress-dlg'>
          <Modal show={showAlart}
                backdrop="static"
                keyboard={false}
                onHide={() => setShowAlart(false)}
          >
            <Modal.Header >
                <Spinner id='progress-spinner' animation="border" /><Modal.Title>{t("commonTitle.importMedia")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p id="prcocces-current"></p>
                <div className='same-pearson-list'>
                  <p id="err-msg" className="errorMsg"></p>
                </div>
                <div className='same-pearson-list'>
                  <p id="prcocces-msg"></p>
                </div>
            </Modal.Body>
            <Modal.Footer>
            <Button id="modal-close-btn" variant="secondary" onClick={() => setShowAlart(false)}>  {t("commonTitle.close")}
            </Button>
            </Modal.Footer>
          </Modal>
        </div>

        {/*  Same Person管理 */}
        <div key='same-person-dlg'>
          <Modal show={showSamePersonMng}
                backdrop="static"
                keyboard={false}
                onHide={() => setShowSamePersonMng(false)}
          >
            <Form>
              <Modal.Header >
                  <Modal.Title>{t("commands.samePrarson")}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <Stack direction="vertical" >
                    <Form.Control type="text" placeholder={t("message.inputQueryString")} key="filter-same-group-name" defaultValue=""
                        onChange={ (e) =>{ const { name, value } = e.target; searchSameGroupHandleChange(e);  } } />
                    <Stack direction="vertical" className='same-pearson-list' >
                        {parentFilterdGroups.map( (person) => (
                            <Form.Check
                              key={`sameParsonK_${person.id}`}
                              defaultChecked={ person.status  }
                              label={`${person.name}`}
                              type="checkbox"
                              id={`idSameParson_${person.id}`}
                              onChange={ (e) =>{ onChangeSameGrpCheckBox(person.id, e.target);  } }
                            />
                          ) )}
                      </Stack>
                  </Stack>
              </Modal.Body>
              <Modal.Footer>
                <Button  variant="primary" onClick={(e) => onClickedUpdateSamePearson(e)}>適用</Button>
                <Button  variant="secondary" onClick={() => setShowSamePersonMng(false)}>{t("commonTitle.close")}</Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </div>

        {/* AddGroup */}
        <div key='add-group-dlg'>
          <Modal show={showAddGroup}
                backdrop="static"
                keyboard={false}
                onHide={() => setShowAddGroup(false)}
          >
            <Form>
              <Modal.Header >
                  <Modal.Title>フォルダーの追加</Modal.Title>
              </Modal.Header>
              <Modal.Body>

                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput1">
                  <Form.Label>{t("commonTitle.name")}</Form.Label>
                  <Form.Control type="text" placeholder="Name" key="add-new-group-name" defaultValue=""
                    onChange={ (e) =>{ const { name, value } = e.target; setDataAddGroup(value);  } } />

                  <p className="errorMsg">{dbPropErros.Name}</p>
                </Form.Group>

                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput2">
                  <Form.Label>以下のフォルダーに下に作成します。</Form.Label>
                  { Object.values( dbPropValues.Strages ).map( (strage:any) => (
                          <><br/><Form.Text className="text-muted">{strage }</Form.Text></>
                      ) )
                  }
                </Form.Group>

              </Modal.Body>
              <Modal.Footer>
                <Button  variant="primary" onClick={(e) => onClickedAddGroup(e)}>追加</Button>
                <Button  variant="secondary" onClick={() => setShowAddGroup(false)}>{t("commonTitle.close")}</Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </div>

        {/*ストレージの選択*/}
        <div key='select-strage'>
          <Modal show={showSelectStrage}
                backdrop="static"
                keyboard={false}
                onHide={() => setShowSelectStrage(false)}
          >
            <Form>
              <Modal.Header >
                  <Modal.Title>インポート</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group className="mb-3" controlId="Import.ControlInput1">
                  <Form.Label controlId="Import.ControlInput1-1">インポートするターゲットフォルダー</Form.Label>
                  <Stack direction="horizontal" >
                    <Form.Control type="text" placeholder="インポート元のするフォルダーを指定してください" defaultValue=""
                      key="import-folder-name"
                      name="import-folder-name2"
                      id="import-folder-name3"
                      onChange={ (e) =>{ const { name, value } = e.target; setImportFolder(value);  } } />
                      <Button  variant="secondary" id="import-folder-name4" onClick={(e) => onSelectImportTargetFolder()}>...</Button>
                  </Stack>
                  <p className="errorMsg">{dbPropErros.importFolder}</p>
                </Form.Group>
                <Form.Group className="mb-3" controlId="Import.ControlInput2">
                  <Form.Label controlId="Import.ControlInput2-1">インポート先のフォルダー</Form.Label>
                  { Object.values( dbPropValues.Strages ).map( (strage:any) => (
                          <>
                            <Form.Check
                              type='radio'
                              name="select-strage"
                              key={`select-strage2-${strage}`}
                              id={`select-strage-${strage}`}
                              label={strage}
                              onChange={ (e) =>{ setSelectedStrage(e.target.id.substring("select-strage-".length));  } }
                            />
                          </>
                      ) )
                  }
                </Form.Group>
                <p className="errorMsg">{dbPropErros.selectedStrage}</p>
              </Modal.Body>
              <Modal.Footer>
                <Button  id="Import.Btn.Do"  variant="primary" onClick={(e) => onClosedSelectStrage(e)}>追加</Button>
                <Button  id="Import.Btn.Cancel+"  variant="secondary" onClick={() => setShowSelectStrage(false)}>{t("commonTitle.close")}</Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </div>
        {/*  DBプロパティのOffCanvas */}
        <div  key='db-prop-offcan'>
          <Offcanvas show={showEdit} onHide={() => setShowEdit(false)} placement="end">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>{t("commands.propertyDb")}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Form id="formDbProp">
                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput1">
                  <Form.Label>{t("commonTitle.name")}</Form.Label>
                  <Form.Control type="text" placeholder="Name" key={dbPropValues.Name} defaultValue={dbPropValues.Name}
                    onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.Name = value; setDbPropValues(dbPropValues);  } } />

                  <p className="errorMsg">{dbPropErros.Name}</p>
                </Form.Group>

                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput2">
                  <Form.Label>{t("commonTitle.searchName")}</Form.Label>
                  <Form.Control type="text" placeholder="Search Name"  key={dbPropValues.SearchName} defaultValue={dbPropValues.SearchName}
                    onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.SearchName = value; setDbPropValues(dbPropValues);  } } />

                  <p className="errorMsg">{dbPropErros.SearchName}</p>
                </Form.Group>
                <Form.Group className="mb-3" controlId="DbPropForm.ControlTextarea1">
                  <Form.Label>{t("commonTitle.comment")}</Form.Label>
                  <Form.Control as="textarea" rows={3}   key={dbPropValues.Comment}  defaultValue={dbPropValues.Comment}
                    onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.Comment = value; setDbPropValues(dbPropValues);  } } />
                </Form.Group>

                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput3">
                  <Form.Label>{t("commonTitle.kind")}</Form.Label>
                  <Form.Select aria-label="Default select example" key={dbPropValues.Kind} defaultValue={dbPropValues.Kind}
                    onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.Kind = parseInt(""+value); setDbPropValues(dbPropValues);  } } >

                    { Object.keys( dbPropValues.ConfKind ).map( (key:any) => (
                      <option key={ `kind-${key}` } value={ dbPropValues.ConfKind[key] } >{key}</option>
                    ) ) }
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput4">
                  <Form.Label>{t("commonTitle.subKind")}</Form.Label>
                  <Form.Select aria-label="Default select example" key={dbPropValues.SubKind} defaultValue={dbPropValues.SubKind}
                    onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.SubKind = parseInt(""+value); setDbPropValues(dbPropValues);  } } >
                    { Object.keys( dbPropValues.ConfSubKind ).map( (key:any) => (
                      <option key={ `subind-${key}` } value={ dbPropValues.ConfSubKind[key] } >{key}</option>
                    ) ) }
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="formFileSm" className="mb-3">
                  <Form.Label>{t("commonTitle.artWork")}</Form.Label>
                  <Form.Control type="text" placeholder="Name" key={dbPropValues.ArtWork} defaultValue={dbPropValues.ArtWork}
                    onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.ArtWork = value; setDbPropValues(dbPropValues);  } } />
                </Form.Group>

                <Form.Group controlId="formStrageMastar" className="mb-3">
                  <Form.Label>{t("commonTitle.configJsonStrage")}</Form.Label>
                  <Form.Select aria-label="Default select example" key={dbPropValues.SaveSID} defaultValue={dbPropValues.SaveSID}
                    onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.SaveSID = value; onChangeSavingSID(value);  } } >
                    { Object.keys( dbPropValues.Strages ).map( (key:any) => (
                      <option key={ `saveStrage-${key}` } value={key}>{ dbPropValues.Strages[key] }</option>
                    ) ) }
                  </Form.Select>
                </Form.Group>

                <Accordion >
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>拡張設定情報</Accordion.Header>

                    <Accordion.Body>
                      <Form.Group controlId="formRecurActive" className="mb-3">
                        <Form.Check type="checkbox" id="id-formRecurActive"
                          label="設定情報の保存先のストレージを子フォルダーも同じストレージを適用する。"
                          defaultChecked={dbPropValues.recurMaster}
                         onChange={ (e) =>{ dbPropValues.recurMaster = e.target.checked; setDbPropValues(dbPropValues);  } } />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="DbPropForm.RecurKind">
                        <Form.Label>子フォルダー作成時に子フォルダーに適用する種類</Form.Label>
                        <Form.Select aria-label="Default select example" key={dbPropValues.recurKind} defaultValue={dbPropValues.recurKind}
                          onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.recurKind = value; setDbPropValues(dbPropValues);  } } >

                          { Object.keys( dbPropValues.ConfKind ).map( (key:any) => (
                            <option key={ `kind-${key}` } value={key} >{key}</option>
                          ) ) }
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="DbPropForm.RecurSubKind">
                        <Form.Label>子フォルダー作成時に子フォルダーに適用する種類２</Form.Label>
                        <Form.Select aria-label="Default select example" key={dbPropValues.recurSubKind} defaultValue={dbPropValues.recurSubKind}
                          onChange={ (e) =>{ const { name, value } = e.target; dbPropValues.recurSubKind = value; setDbPropValues(dbPropValues);  } } >
                          { Object.keys( dbPropValues.ConfSubKind ).map( (key:any) => (
                            <option key={ `subind-${key}` } value={key} >{key}</option>
                          ) ) }
                        </Form.Select>
                      </Form.Group>

                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>


                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput1">
                  <Form.Label>その他データ(JSONフォーマット)</Form.Label>
                  <Form.Control as="textarea" rows={10}
                    onChange={ (e) =>{ const { name, value } = e.target; setTextConfigJSON(value);  } } >
                    {textConfigJSON}
                  </Form.Control>
                  <p className="errorMsg">{dbPropErros.ConfigJson}</p>
                </Form.Group>

                <br />
                <Form.Group controlId="formButton" className="mb-3" >
                  <div className='div-right'>
                  <Button variant="primary" type="submit" onClick={ (e) => onClickedDbPopSaveChange(e) } >{t("commonTitle.save")}</Button>
                  <Button variant="secondary" type="button"  onClick={() => setShowEdit(false)}  >{t("commonTitle.close")}</Button>
                  </div>
                </Form.Group>

              </Form>
            </Offcanvas.Body>
          </Offcanvas>
        </div>

        {/* 絞り込みエリア　 */}
        <div  key='qury-pane' id="dviSearchGroup">
        <Stack direction="horizontal" gap={2}>
            <Accordion >
              <Accordion.Item eventKey="0">
                <Accordion.Header><FilterAltIcon/>{makeHTMLFilterText()}</Accordion.Header>
                <Accordion.Body>
                  <Form id="frmGropSearch">
                    <Stack direction="horizontal" gap={2}>
                      <Stack direction="horizontal" gap={2}>
                        <DropdownButton title={queryValues.QFavStr} variant="outline-secondary" id="bg-nested-dropdown" defaultValue={queryValues.QFav}>
                          <Dropdown.ItemText>{t("commonTitle.queryFavorite")}</Dropdown.ItemText>
                          <Dropdown.Item eventKey="qfav-0" onClick={ (e) => { onClickQueryFavorite(e,0); } }>{t("commonTitle.clear")}</Dropdown.Item>
                          <Dropdown.Item eventKey="qfav-1" onClick={ (e) => { onClickQueryFavorite(e,1); } }>{t("message.Favorite1")}</Dropdown.Item>
                          <Dropdown.Item eventKey="qfav-2" onClick={ (e) => { onClickQueryFavorite(e,25); } }>{t("message.Favorite2")}</Dropdown.Item>
                          <Dropdown.Item eventKey="qfav-3" onClick={ (e) => { onClickQueryFavorite(e,50); } }>{t("message.Favorite3")}</Dropdown.Item>
                          <Dropdown.Item eventKey="qfav-4" onClick={ (e) => { onClickQueryFavorite(e,75); } }>{t("message.Favorite4")}</Dropdown.Item>
                          <Dropdown.Item eventKey="qfav-5" onClick={ (e) => { onClickQueryFavorite(e,99); } }>{t("message.Favorite5")}</Dropdown.Item>
                        </DropdownButton>
                      </Stack>
                      <Form.Control
                        id='input-query-text'
                        name="searchGroupTxt"
                        type="text"
                        placeholder={t("message.inputQueryString")}
                        className=" mr-sm-2"
                        defaultValue={queryValues.QStr}
                        onChange={(e) => searchGroupHandleChange(e)}
                      />
                    </Stack>
                  </Form>
                </Accordion.Body>
              </Accordion.Item>
              </Accordion>
              <Accordion>
              <Accordion.Item eventKey="1">
                <Accordion.Header><SortByAlphaIcon/>:{orderValues.OrderDisp}</Accordion.Header>
                <Accordion.Body>
                  <Form id="frmOrder">
                    <Stack direction="vertical" gap={2}>
                      <DropdownButton title={orderValues.OrderDisp} variant="outline-secondary" id="bg-order-drop" >
                        <Dropdown.ItemText>{t("message.selectOrder")}</Dropdown.ItemText>
                        <Dropdown.Item eventKey="order-0" onClick={ (e) => { onClickOrder(e,'Name'); } }>{t("commonTitle.orderDispName")}</Dropdown.Item>
                        <Dropdown.Item eventKey="order-1" onClick={ (e) => { onClickOrder(e,'Favorite'); } }>{t("commonTitle.orderDispFavorite")}</Dropdown.Item>
                        <Dropdown.Item eventKey="order-2" onClick={ (e) => { onClickOrder(e,'Year'); } }>{t("commonTitle.orderDispYear")}</Dropdown.Item>
                        <Dropdown.Item eventKey="order-3" onClick={ (e) => { onClickOrder(e,'Title'); } }>{t("commonTitle.orderDispTitle")}</Dropdown.Item>
                        <Dropdown.Item eventKey="order-4" onClick={ (e) => { onClickOrder(e,'Track'); } }>{t("commonTitle.orderDispTrack")}</Dropdown.Item>
                      </DropdownButton>
                    </Stack>
                  </Form>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
            </Stack>
        </div>


        {/* アイテムの一覧リスト　 */}
        {  makeHTMLList() }
        {/*
        <div key='list-items' className="d-flex flex-wrap ItemList">
         {queryListData.map( (listD:ListItem) => (
          <div key={ listD.getKey() } className="onCard"
                onClick={ (e) => handleDetailClick2(listD.type,  listD.getID()) }>
              <Card style={{ width: '18rem' }} className='item-card'>

                <Card.Body>
                  <Stack direction="horizontal" gap={2}>
                    <Card.Img  className="GroupList-img" src={ listD.getCardImage() } />

                    <Stack direction="vertical" gap={3}>

                      <Stack direction="horizontal" gap={2}>
                        <div >{ listD.getHtmlPlayTime() }</div>
                        <div className="ms-auto">{listD.getHtmlYear() }</div>
                      </Stack>


                      <Stack direction="horizontal" gap={1}>
                        <div>{listD.getHtmlOther()}</div>
                      </Stack>

                      <Stack direction="horizontal" gap={2}>
                        <div >{listD.getHtmlFavarit()}</div>
                        <div className='div-center'>{listD.getHtmlTrack()}</div>
                      </Stack>
                    </Stack>


                  </Stack>
                  <Card.Subtitle className="mb-2 text-muted">{listD.getLinkIcon()}{listD.getTitleIcon()}{ listD.getTitle() }</Card.Subtitle>
                  <Card.Text>{ listD.getComment() }</Card.Text>
                  <Card.Footer>
                    {listD.getHtmlCardFooter()}
                  </Card.Footer>
                </Card.Body>
              </Card>
          </div>
         ) )}
        </div>
*/}


    </div>
  );
}

export default GroupDetailPage;
