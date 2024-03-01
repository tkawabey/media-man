import { Button, Stack, Card,Navbar,InputGroup ,
  Row , Col, Form  } from 'react-bootstrap';
import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { NavigateOptions, useNavigate, useParams  } from 'react-router-dom';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Pagination from 'react-bootstrap/Pagination';
import NotListedLocationIcon from '@mui/icons-material/NotListedLocation';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { convertPathLocal2URL
  , getGropImagePath
  , getFavoriteTextKey
  , hasValue
  , getShortText
  , getItemName

  , PAGE_ITEM_CNT

  , makeHtmlItemOfPlayTime
  , makeHtmlItemOfYear
  , makeHtmlItemOfYearEvaluation
  , makeHtmlItemOfTrack
  , makeHtmlItemOfOther
} from "../commonfunc"

import noimage from '../../../assets/e_others_501.png'



function GenrePage() {
  const { t } = useTranslation();
  const locationD = useLocation();
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState([]);


  const [genreName, setGenreName] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [activePage, setActivePage] = useState(0);
  let initPagenumbers:number[] = [];
  const [pagenumbers, setPagenumbers] = useState(initPagenumbers);


  const navi = useNavigate();
  const {id} = useParams();
  let bRendring : boolean = false;

  // ページの読み込み時
  useEffect( () => {
    if( bRendring == false )
    {
      let iGenreID:number = parseInt("" + id);
      loading(iGenreID, 0);
    }
  }, []);


  // ページロード中の実装をここで、行います。
  async function loading(
        GENRE_ID:number   // ジャンルID
        , iPageNo:number  // ページ番号 0～
  ) {
    bRendring = true;

    // ジャンル名をセット
    setGenreName(
      await window.electron.doGetGenreName(GENRE_ID)
    );

    let iToalCount:number = await window.electron.doGetItemCountWhereGenreID(GENRE_ID);
    //console.log("iToalCount=", iToalCount);
    setTotalCount(iToalCount);

    let iTotalPage:number = iToalCount / PAGE_ITEM_CNT;
    if( (iToalCount % PAGE_ITEM_CNT) != 0 ) {
      iTotalPage++;
    }
    // 少数点は、切り捨て
    iTotalPage = Math.floor(iTotalPage);
    //console.log("iTotalPage=", iTotalPage);
    let tPageNumbers:number[] = [];
    for(let i:number = 0; i < iTotalPage; i++)
    {
      tPageNumbers.push(i);
    }
    setPagenumbers(tPageNumbers);
    setActivePage(iPageNo);

    let iAccessPage:number = 0;
    //console.log("locationD!.state!", locationD!.state );
    if( locationD!.state != null ) {
      if( locationD!.state!.pageNo != undefined )
      {
        iAccessPage = locationD!.state!.pageNo as number;
        if( iAccessPage >= 1 ) {
          iAccessPage--;
        }
      }
    }

    let iOffset:number = iPageNo * PAGE_ITEM_CNT;
    setOffset(iOffset);

    let retItems = await window.electron.doGetItemsWhereGenre(GENRE_ID, PAGE_ITEM_CNT, iOffset);
    setOffset(0);

    setItems(retItems);
    //console.log("retItems", retItems);
    //フィルタリング機能
    setSearchQuery(
      retItems
    );

    bRendring = false;;
  }

  // Inputのchangeコールバック
  function  handleChange(e:any)
  {
    const { name, value } = e.target;
    let strSeach = value.toLowerCase();

    //フィルタリング機能
    setSearchQuery(
      items.filter((item:any) =>
      item.Title.toLowerCase().startsWith(strSeach)
      )
    );
    return true;
  }


  // アイテムのキー文字を返します。
  function strItemKey(item:any)
  {
    let strKey:string = "";
    strKey = "i";
    strKey += item.IID;
    return strKey;
  }

  //
  function makeHtmlRowItemImg(item:any)
  {
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
  // アイテムの詳細画面に遷移
  async function handleDetailClick(IID:number, ext:string)
  {
    let idList = [];
    for(let itm of items )
    {
      let i:any = itm as any;
      idList.push(i.IID);
    }

    let opt:NavigateOptions = {
      state:{"idList":idList},
      replace:false
    };
    navi('/item/' + IID, opt);
  }

  //
  async function handlePageChange(GENRE_ID:string|undefined, pageNo:number)
  {
    if( GENRE_ID == undefined ) {
      return;
    }


    let opt:NavigateOptions = {
      state:{"pageNo":pageNo},
      replace:false
    };
    navi('/genre/' + GENRE_ID, opt);

    console.log("handlePageChange pageNo=", pageNo);
    loading( parseInt(""+GENRE_ID), pageNo);
  }

  return (
    <div className="content">
    <div>
      <Breadcrumb>
        <Breadcrumb.Item href="/groups">Home</Breadcrumb.Item>
        <Breadcrumb.Item active>{t("commonTitle.genre")}:{genreName}</Breadcrumb.Item>
    </Breadcrumb>
    </div>
      <div>
        <Navbar className="bg-body-tertiary justify-content-around">
        <Form >
          <Row>
            <Col xs="auto">
              <Form.Control
                name="searchTxt"
                type="text"
                placeholder={t("message.inputQueryString")}
                className=" mr-sm-2"
                onChange={(e) => handleChange(e)}
              />
            </Col>
          </Row>
        </Form>
      </Navbar>
      </div>
      <div className="d-flex flex-wrap GroupList">
        {searchQuery.map( (item:any) => (

          <div key={ strItemKey(item) } className=""
            onClick={ (e) => handleDetailClick(item.IID, item.ext) }>
            <Card style={{ width: '18rem' }}>

              <Card.Body>
                <Stack direction="horizontal" gap={2}>
                  <Card.Img  className="GroupList-img" src={makeHtmlRowItemImg(item)} />
                  <Stack direction="vertical" gap={3}>
                    <Stack direction="horizontal" gap={2}>
                      <div >{makeHtmlItemOfPlayTime(item, t)}</div>
                      <div className="ms-auto">{makeHtmlItemOfYear(item) }</div>
                    </Stack>
                    <Stack direction="horizontal" gap={2}>
                      <div >{makeHtmlItemOfYearEvaluation(item, t)}</div>
                      <div className='div-center'>{makeHtmlItemOfTrack(item)}</div>
                    </Stack>

                    <Stack direction="horizontal" gap={1}>
                      <div>{makeHtmlItemOfOther(item, t)}</div>
                    </Stack>
                  </Stack>
                </Stack>
                <Card.Subtitle className="mb-2 text-muted">{getItemName(item)}</Card.Subtitle>
                <Card.Text>{ getShortText(item.Comment, 15) }</Card.Text>
                <Card.Footer>
                </Card.Footer>
              </Card.Body>
            </Card>
        </div>
        ) )}
      </div>
      <Stack gap={1} className="col-md-5 mx-auto div-paging-navi">
        <Pagination>
          {pagenumbers.map( (page:number) => (
              <Pagination.Item key={page} active={page === activePage}
                onClick={ (e) => handlePageChange(id, page) }
              >
              {page+1}
            </Pagination.Item>
          ) )}
        </Pagination>
      </Stack>
    </div>
  );
}

export default GenrePage;
