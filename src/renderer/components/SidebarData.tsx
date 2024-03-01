import React from "react";
import HomeIcon from "@mui/icons-material/Home";
import AttachEmailIcon from "@mui/icons-material/AttachEmail";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddCardIcon from "@mui/icons-material/AddCard";
import BackupIcon from "@mui/icons-material/Backup";
import SettingsIcon from "@mui/icons-material/Settings";
import PermMediaIcon from '@mui/icons-material/PermMedia';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
/*
  サイドバーに表示するデータ作成
  Jsonデータとして作成
*/
export const SidebarData = [
  {
    title: "ホーム",
    icon: <HomeIcon />,
    link: "/home",
  },
  {
    title: "グループ",
    icon: <PersonAddIcon />,
    link: "/groups",
  },
  {
    title: "ジャンル",
    icon: <AddCardIcon />,
    link: "/genreMange",
  },
  {
    title: "タグ",
    icon: <LocalOfferIcon />,
    link: "/tagMange",
  },
  {
    title: "メディアフォルダー",
    icon: <PermMediaIcon />,
    link: "/strages",
  },
  {
    title: "詳細設定",
    icon: <SettingsIcon />,
    link: "/config",
  },
];
