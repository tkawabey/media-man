import React from "react";
import { useNavigate  } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import PermMediaIcon from '@mui/icons-material/PermMedia';
import AddCardIcon from "@mui/icons-material/AddCard";
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SettingsIcon from "@mui/icons-material/Settings";
import FileOpenIcon from '@mui/icons-material/FileOpen';

function Sidebar() {
  const { t } = useTranslation();
  const navi = useNavigate();
  {/* HashRouterを使用しているので、useNavigateで画面遷移させます */}
  function locationChange(url:string)
  {
    navi(url);
    window.location.reload();
  }

  return (
    <div id="layoutSidenav_nav" className="side">
      <br/>
      <br/>
      <br/>
      <br/>
      <ul className="SidebarList">
            <li key="" className="row" onClick={() => { locationChange('/home'); }} >
              <div id="icon"><PermMediaIcon /></div>
              <div id="title">{t("commonTitle.home")}</div>
            </li>
            <li key="" className="row" onClick={() => { locationChange('/genreMange'); }} >
              <div id="icon"><AddCardIcon /></div>
              <div id="title">{t("commonTitle.genre")}</div>
            </li>
            <li key="" className="row" onClick={() => { locationChange('/tagMange'); }} >
              <div id="icon"><LocalOfferIcon /></div>
              <div id="title">{t("commonTitle.tag")}</div>
            </li>
            <li key="" className="row" onClick={() => { locationChange('/strages'); }} >
              <div id="icon"><FileOpenIcon /></div>
              <div id="title">{t("commonTitle.strage")}</div>
            </li>
      </ul>
    </div>
  );
}

export default Sidebar;
