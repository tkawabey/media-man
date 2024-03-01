import React, { useState, useEffect, useContext } from "react";
import { NavigateOptions, useNavigate,useParams  } from 'react-router-dom';
import Table from 'react-bootstrap/Table';
import { Stack} from 'react-bootstrap';
import Pagination from 'react-bootstrap/Pagination';
import { SearchResultData } from '../App';
import { getSearchResultData, hasValue, getShortText } from "../commonfunc";


import FolderIcon from '@mui/icons-material/Folder';                // Kindが不明なグループ
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';    // KindがMusicなグループ
import ImageIcon from '@mui/icons-material/Image';                  // KindがImageなグループ
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';    // KindがVideoなグループ
import InsertDriveFileTwoToneIcon from '@mui/icons-material/InsertDriveFileTwoTone';  // 拡張子が不明なアイテム
import AudioFileTwoToneIcon from '@mui/icons-material/AudioFileTwoTone';              // 拡張子がMusicなアイテム
import VideoFileTwoToneIcon from '@mui/icons-material/VideoFileTwoTone';              // 拡張子がVideoなアイテム
import InsertPhotoTwoToneIcon from '@mui/icons-material/InsertPhotoTwoTone';          // 拡張子がImageなアイテム
import LinkTwoToneIcon from '@mui/icons-material/LinkTwoTone';                        // ハイパーリンク


//
//  検索結果
//
function SearchResultPage() {
  const {searchText} = useParams();
  const { searchResult, setSearchResult } = useContext(SearchResultData);
  //const [searchResult, setSearchResult] = useState([]);



  const navi = useNavigate();
  let bRendring : boolean = false;

  // ページの読み込み時
  useEffect( () => {
    if( bRendring == false )
    {
      loading();
    }
  }, []);

  // ページロード中の実装をここで、行います。
  async function loading() {
      bRendring = true;

      let retVal = await getSearchResultData("" + searchText, 0, searchResult);
      setSearchResult({ result:retVal.result, active:retVal.active, pages:retVal.pages, PAGE_ITEMS:searchResult.PAGE_ITEMS, searchTxt:searchText!,
        totalPage:retVal.totalPage, totalCount:retVal.totalCount });

    bRendring = false;;
  }



  // クリック時に、詳細画面へ遷移
  function clickHandler( type:number, id:number )
  {
    if( type === 0 ) {
      // Group
      navi('/group/' + id);
    }
    else
    if( type === 1 ) {
      // Item
      let opt:NavigateOptions = {
        state:{"idList":[]},
        replace:true
      };
      navi('/item/' + id, opt);
    }
  }
  // ページの遷移
  async function handlePageChange( page:number )
  {
    //console.log("page", page);
    let retVal = await getSearchResultData(
      searchResult.searchTxt, page, searchResult);

    //console.log("retVal", retVal);
    setSearchResult({ result:retVal.result
      , active:retVal.active
      , pages:retVal.pages
      , PAGE_ITEMS:searchResult.PAGE_ITEMS
      , searchTxt:searchText!
      , totalPage:retVal.totalPage, totalCount:retVal.totalCount });
  }

  function makeHTMLPagingPrev(sr:any)
  {
    if( searchResult.pages.length != 0 &&  searchResult.pages[0] != 0 ) {
      return (<> <Pagination.First onClick={ (e) => handlePageChange(0) }   /></>);
    } else {
      return (<></>);
    }
  }

  function makeHTMLPagingNext(sr:any)
  {
    if( searchResult.pages.length != 0 && searchResult.pages.at(-1) != (searchResult.totalPage-1) ) {
      return (<> <Pagination.Last onClick={ (e) => handlePageChange(searchResult.totalPage-1) }  /></>);
    } else {
      return (<></>);
    }
  }
  /**
import FolderIcon from '@mui/icons-material/Folder';                // Kindが不明なグループ
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';    // KindがMusicなグループ
import ImageIcon from '@mui/icons-material/Image';                  // KindがImageなグループ
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';    // KindがVideoなグループ
import InsertDriveFileTwoToneIcon from '@mui/icons-material/InsertDriveFileTwoTone';  // 拡張子が不明なアイテム
import AudioFileTwoToneIcon from '@mui/icons-material/AudioFileTwoTone';              // 拡張子がMusicなアイテム
import VideoFileTwoToneIcon from '@mui/icons-material/VideoFileTwoTone';              // 拡張子がVideoなアイテム
import InsertPhotoTwoToneIcon from '@mui/icons-material/InsertPhotoTwoTone';          // 拡張子がImageなアイテム
import LinkTwoToneIcon from '@mui/icons-material/LinkTwoTone';                        // ハイパーリンク

   *
   */

  function makeHTMLImage(d:any)
  {
    if( d.BaseType === 0 )
    {
      if( d.Kind === 1 ||  d.Kind === 2 )
      {
        return (<><ImageIcon/></>);
      }
      if( d.Kind === 3 )
      {
        return (<><LibraryMusicIcon/></>);
      }
      if( d.Kind === 4 )
      {
        return (<><VideoLibraryIcon/></>);
      }
      return (<><FolderIcon/></>);

    } else {
      if (hasValue(d.ContentType) === false)
      {
        if( d.Ext === 'mp3' || d.Ext === 'm4a' || d.Ext === 'wav' ) {
          return (<><AudioFileTwoToneIcon/></>);
        }
        if( d.Ext === 'mp4' || d.Ext === 'avi' || d.Ext === 'mpeg' || d.Ext === 'mov'  ) {
          return (<><VideoFileTwoToneIcon/></>);
        }
        if( d.Ext === 'jpg' || d.Ext === 'png' || d.Ext === 'gif' ) {
          return (<><InsertPhotoTwoToneIcon/></>);
        }
        if( d.Ext === 'lnk' ) {
          return (<><LinkTwoToneIcon/></>);
        }
      }
      if (d.ContentType.startsWith('audio/')) {
        return (<><AudioFileTwoToneIcon/></>);
      }
      if (d.ContentType.startsWith('video/')) {
        return (<><VideoFileTwoToneIcon/></>);
      }
      if (d.ContentType.startsWith('image/')) {
        return (<><InsertPhotoTwoToneIcon/></>);
      }
      return (<><InsertDriveFileTwoToneIcon/></>);
    }
  }


  return (
    <div className="content">
      <div className="todos" id='idSearchResult'>
      <Table striped bordered hover variant="light">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Comment</th>
            <th>Code</th>
            <th>Title</th>
          </tr>
        </thead>
        <tbody>
          {searchResult.result.map( (d:any) => (
            <tr key={d.DID} onClick={ (e) => { clickHandler(d.BaseType, d.DID); }}>
                <td>{makeHTMLImage(d)}</td>
                <td>{d.Name}</td>
                <td>{ getShortText(d.Comment, 255)}</td>
                <td>{d.Code}</td>
                <td>{ getShortText(d.Title, 255)}</td>
            </tr>
          ) ) }
        </tbody>
        </Table>
        </div>
        <Stack gap={1} className="col-md-5 mx-auto div-paging-navi">
        <Pagination>
          {makeHTMLPagingPrev(searchResult)}
          {searchResult.pages.map( (page:number) => (
              <Pagination.Item key={page} active={page === searchResult.active}
                onClick={ (e) => handlePageChange(page) }
              >
              {page+1}
            </Pagination.Item>
          ) )}
          {makeHTMLPagingNext(searchResult)}
        </Pagination>
      </Stack>

    </div>
  );
}

export default SearchResultPage;
