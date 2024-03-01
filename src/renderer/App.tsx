import { Routes, Route } from 'react-router-dom';
import { createContext, useState } from 'react';
import Sidebar from "./components/Sidebar";
import StragePage from "./components/Strage";
import StrageEdtPage from "./components/StrageEdt";
import GroupDetailPage from "./components/GroupDetail";
import ItemDetailPage from "./components/ItemDetail";
import GenreMangePage from "./components/GenreMange";
import GenrePage from "./components/Genre";
import TagMangePage from './components/TagMange'
import TagPage from './components/Tag'
import Navi from "./components/Navi";
import SearchResultPage from "./components/SearchResult";
import './App.css';



//
//  Naviコンポーネントから、検索結果コンポーネントを連動させるたUseContextを使用
//
function setDummy(val:{ result:any[], active:number, pages:number[], PAGE_ITEMS:number, searchTxt:string,totalPage:number, totalCount:number } )
{
  console.log("calld setDummy.");
}
const initSearchResult:{ result:any[], active:number, pages:number[], PAGE_ITEMS:number, searchTxt:string,totalPage:number, totalCount:number }
                     = { result:[], active:0, pages:[0], PAGE_ITEMS:100, searchTxt:"",totalPage:1, totalCount:0 };

export const SearchResultData = createContext({
  searchResult:initSearchResult
  ,
  setSearchResult:setDummy });
//
//
//
export default function App() {

  const [searchResult, setSearchResult] = useState(initSearchResult); // 検索結果
  const contextValues = {
    searchResult,
    setSearchResult
  };

  return (

    <div className="App" data-bs-theme="datk">
        {/*
          data-bs-theme
            datk
            light
        */}
      <SearchResultData.Provider value={contextValues}>
      <Navi />
      <div id="layoutSidenav">
        <Sidebar />

        <div id="layoutSidenav_content">
          <Routes>
            <Route path="/" element={<GroupDetailPage />} />
            <Route path="/home" element={<GroupDetailPage />} />
            <Route path="/groups" element={<GroupDetailPage />} />

            <Route path="/group/:id" element={<GroupDetailPage />} />
            <Route path="/item/:id" element={<ItemDetailPage />} />

            <Route path="/strages" element={<StragePage />} />
            <Route path="/strage/new" element={<StrageEdtPage />} />

            <Route path="/genreMange" element={<GenreMangePage />} />
            <Route path="/genre/:id" element={<GenrePage />} />

            <Route path="/tagMange" element={<TagMangePage />} />
            <Route path="/tag/:id" element={<TagPage />} />

            <Route path="/search/:searchText"  element={<SearchResultPage/>} />
          </Routes>
        </div>
      </div>
      </SearchResultData.Provider>
    </div>
  );
}
