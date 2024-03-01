import Form from 'react-bootstrap/Form';
import { Button, Stack } from 'react-bootstrap';
import { useNavigate  } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import React, { useContext, useEffect } from "react";
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from '@mui/icons-material/Search';
import { SearchResultData } from '../App';
import { getSearchResultData } from '../commonfunc';



function Navi() {
  const navi = useNavigate();

  const { searchResult, setSearchResult } = useContext(SearchResultData);
  const handleSideMenuClick = async (event:any) => {
    event.preventDefault();
    document.body.classList.toggle('sb-sidenav-toggled');
    localStorage.setItem('sb|sidebar-toggle', "" + document.body.classList.contains('sb-sidenav-toggled'));
  }

  // 検索の実行
  const handleClickSearch = async (event:any) => {
    //event.preventDefault();

    let isResultPage:HTMLElement|null= document.getElementById('idSearchResult');

    let ipt:HTMLInputElement|null= document.getElementById('textSearch') as HTMLInputElement;
    //console.log(ipt!.value);

    let searchText = ipt!.value;

    searchText = searchText.trim();


    if( isResultPage != null )
    {
      let retVal = await getSearchResultData("" + searchText, 0, searchResult);

      setSearchResult({ result:retVal.result, active:retVal.active, pages:retVal.pages, PAGE_ITEMS:searchResult.PAGE_ITEMS, searchTxt:searchText,
        totalPage:retVal.totalPage, totalCount:retVal.totalCount });

    } else {
      // 検索結果ページでない場合は、遷移させるために、naviをコール
      navi('/search/' + searchText);//, {replace:true, relative:"route"});
    }
  }



  return (
    <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
            <Stack className='SidebarList' direction="horizontal" gap={4}>
              <div className="p-2">
              <Button variant="secondary" className="btn btn-link " id="sidebarToggle"
                      onClick={ handleSideMenuClick } >
                  <DensityMediumIcon/>
              </Button>
              </div>
              <div className="p-2">
              <a className="navbar-brand ps-3" href="/home">media-monitor</a>
              </div>
              <div className="p-2 ms-auto">a</div>
              {/*
              <Button className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0" id="sidebarToggle"
                      onClick={ handleSideMenuClick } >
                  <DensityMediumIcon/>
              </Button>
              */}
              <div className="p-2">
              <Form>
                  <div className="input-group">
                    <Form.Control type="text" id='textSearch'  className="form-control" placeholder="Search for..." />
                    <Button variant="secondary" type="submit" className="btn btn-secondary" onClick={ handleClickSearch }   ><SearchIcon/></Button>
                  </div>
              </Form>
              </div>


            </Stack>
            {/*
            <form className="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0">
                <div className="input-group">
                    <input className="form-control" type="text" placeholder="Search for..." aria-label="Search for..." aria-describedby="btnNavbarSearch"/>
                    <button className="btn btn-primary" id="btnNavbarSearch" type="button"><SearchIcon/></button>
                </div>
            </form>
            <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
                <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      <SettingsIcon/>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                        <li><a className="dropdown-item" href="#!">Settings</a></li>
                        <li><a className="dropdown-item" href="#!">Activity Log</a></li>
                        <li><hr className="dropdown-divider"/></li>
                        <li><a className="dropdown-item" href="#!">Logout</a></li>
                    </ul>
                </li>
            </ul>
            */}
        </nav>
  );
}

export default Navi;
