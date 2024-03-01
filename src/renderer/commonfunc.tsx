import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';

import MusicNoteIcon from '@mui/icons-material/MusicNote';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ImageIcon from '@mui/icons-material/Image';

import LinkIcon from '@mui/icons-material/Link';
import noimage from '../../assets/e_others_501.png';

// ジャンル、タグ画面など、1ページに表示出来るアイテムの最大数
export const PAGE_ITEM_CNT = 9;

// 指定した値が、unndef or numm or Stringなら""でない？かを確認します。
export function hasValue(value: any | undefined | null): boolean {
  if (value === undefined) {
    return false;
  }
  if (value == null) {
    return false;
  }
  if (typeof value === 'string') {
    if (value.length === 0) {
      return false;
    }
  }
  return true;
}

export function htmlElemDisp(element: any, iDisp: boolean) {
  if (element === undefined || element == null) {
    return;
  }
  if (element!.style === undefined) {
    return;
  }
  if (element!.style === undefined) {
    return;
  }
  if (element!.style.display === undefined) {
    return;
  }

  element!.style.display = iDisp ? 'block' : 'none';
}

// ローカルファイルパスを、URLエンコードしたパスに変換します。
export function convertPathLocal2URL(strPath: string): string {
  let strWork = strPath;
  let strWork2 = strPath;
  strWork = strWork.replaceAll('\\', '/');
  strWork = encodeURI(strWork);

  if (
    strWork.startsWith('http://') ||
    strWork.startsWith('https://') ||
    strWork.startsWith('file://')
  ) {
    return strWork;
  }

  if (strWork.startsWith('//')) {
    strWork2 = 'file:';
  } else {
    strWork2 = 'file:///';
  }
  strWork2 += strWork;

  return strWork2;
}

// ローカルファイルパスを、URLエンコードしたパスに変換します。
export function getGropImagePath(group: any): string {
  let strGroupArtworkPath = '';

  if (!(group.ArtWork === undefined || group.ArtWork == null)) {
    strGroupArtworkPath = group.ArtWork;
    if (strGroupArtworkPath !== '') {
      strGroupArtworkPath = convertPathLocal2URL(strGroupArtworkPath);
    }
  }
  if (strGroupArtworkPath === '') {
    strGroupArtworkPath = noimage;
  }
  return strGroupArtworkPath;
}

// お気に入りの数値の値から、テキスト変換キーを取得
export function getFavoriteTextKey(iFav: number | undefined | null): string {
  if (iFav === undefined || iFav == null) {
    return 'message.noSetFavorite';
  }
  if (iFav === 0) {
    return 'message.noSetFavorite';
  }
  if (iFav >= 1 && iFav <= 24) {
    return 'message.Favorite1';
  }
  if (iFav >= 25 && iFav <= 49) {
    return 'message.Favorite2';
  }
  if (iFav >= 50 && iFav <= 74) {
    return 'message.Favorite3';
  }
  if (iFav >= 75 && iFav <= 98) {
    return 'message.Favorite4';
  }
  if (iFav >= 99) {
    return 'message.Favorite5';
  }
  return 'message.noSetFavorite';
}

// 指定したコメント文字をショート文字に変換
export function getShortText(strComment: string | undefined | null, len:number) {
  if (strComment === undefined || strComment == null) {
    return '';
  }
  if (strComment.length < len) {
    return strComment;
  }
  return `${strComment.substring(0, len)}.....`;
}
// アイテムの名前を取得
export function getItemName(item: any): string {


  if( item.linkItem != undefined ) {
    item = item.linkItem;
  }

  if( hasValue(item.Title) == true )
  {
    return item.Title;
  }
  return item.name;
}

// PlayTimeのHTML文を作成
export function makeHtmlItemOfPlayTime(item: any, t: any) {

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
}
// PlayTimeのHTML文を作成
export function makeHtmlItemOfYear(item: any) {

  if( item.linkItem != undefined ) {
    item = item.linkItem;
  }

  if (item.Year == null) {
    return  (<></>);
  }
  return (
    <>
      <CalendarMonthIcon className="image16" />
      {item.Year}
    </>
  );
}
// EvaluationのHTML文を作成
export function makeHtmlItemOfYearEvaluation(item: any, t: any) {

  if( item.linkItem != undefined ) {
    item = item.linkItem;
  }

  if (item.Favorite == null) {
    return  (<></>);
  }

  return (
    <>
      <FavoriteBorderIcon className="image16" />
      { t( getFavoriteTextKey(item.Favorite)) }
    </>
  );
}
// トラックのHTMLを取得
export function makeHtmlItemOfTrack(item: any) {

  if( item.linkItem != undefined ) {
    item = item.linkItem;
  }

  if (item.Track === undefined || item.Track == null) {
    return (<></>);
  }
  return (
    <>
      <AudiotrackIcon className="image16" /> {item.Track}
    </>
  );
}
export function makeHtmlItemOfOther(item: any, t: any) {


  if( item.linkItem != undefined ) {
    item = item.linkItem;
  }

  if (hasValue(item.ContentType) === false) {
    return (<></>);
  }
  if (item.ContentType.startsWith('audio/')) {
    if (item.PlayCount === undefined) {
      return (<></>);
    }
    let playCount  = 0;
    if( item.PlayCount != null ) { playCount  = item.PlayCount; }

    let msg = t('message.PlayCount');
    msg = msg.replace('${PlayCount}', `${playCount}`);
    return <>{msg}</>;
  }
  if (item.ContentType.startsWith('video/')) {
    let rate = item.FrameRate as number;
    rate /= 1000;
    return (
      <>
        {item.FrameW} x {item.FrameH} ({rate})
      </>
    );
  }
  if (item.ContentType.startsWith('image/')) {
    return (
      <>
        {item.FrameW} x {item.FrameH} ({item.FrameRate})
      </>
    );
  }
  return (<></>);
}

// メディアタイプアイコンのHTMLを取得
export function makeHtmlItemOfMediaType(item: any) {
  if( item.linkItem != undefined ) {
    item = item.linkItem;
  }

  if (hasValue(item.ContentType) === false) {
    return (<></>);
  }


  if (item.ContentType.startsWith('audio/')) {
    return (<>{ makeHtmlItemOfTrack(item) }. </>);
    /*
    return (<><MusicNoteIcon className='image16'/></>);
    */
  }
  if (item.ContentType.startsWith('video/')) {
    return (<><OndemandVideoIcon className='image16'/></>);
  }
  if (item.ContentType.startsWith('image/')) {
    return (<><ImageIcon className='image16'/></>);
  }
  return (<></>);
}
// リンクアイコンのHTMLを取得
export function makeHtmlItemOfLinkIcon(item: any) {

  if( item.ext == "lnk" ) {
    return ( <><LinkIcon className='image16'/>  </>);
  }
  return (<></>);
}

//
//  検索
//
export async function getSearchResultData(searchText:string, iPage:number,
    context:{ result:any[], active:number, pages:number[], PAGE_ITEMS:number, searchTxt:string,totalPage:number, totalCount:number  })
{

  let iToalCount:number = await window.electron.doCountSearchFreeWoard(searchText);

  context.totalCount = iToalCount;


  let iTotalPage:number = iToalCount / context.PAGE_ITEMS;
  if( (iToalCount % context.PAGE_ITEMS) != 0 ) {
    iTotalPage++;
  }
  // 少数点は、切り捨て
  iTotalPage = Math.floor(iTotalPage);
  context.totalPage = iTotalPage;
  //console.log("iTotalPage=", iTotalPage);
  let tPageNumbers:number[] = [];

  let iStartPage = 0;
  let iEndPage = iTotalPage;
  if( iTotalPage > 10 ) {
    // トータル10ページ以上の場合は、カレントページの前後5ページとする。
    if( iPage > 5 ) {
      iStartPage = iPage - 5;
    }
    if( iStartPage + 10 < iTotalPage ) {
      iEndPage = iStartPage + 10;
    }
    //console.log("sa=", iEndPage - iStartPage);
    if( iEndPage - iStartPage != 10 )
    {
      iStartPage = iEndPage - 10;
    }
  }

  for(let i:number = iStartPage; i < iEndPage; i++)
  {
    tPageNumbers.push(i);
  }

  let iOffset:number = (iPage) * context.PAGE_ITEMS;

  let rows:any = await window.electron.doSearchFreeWoard(searchText, context.PAGE_ITEMS, iOffset);
  context.result = rows;
  context.active = iPage;
  context.pages = tPageNumbers;
  context.searchTxt = searchText;
  return context;
//  return { result:rows, active:iPageNo, pages:tPageNumbers,
//    PAGE_ITEMS:context.PAGE_ITEMS, searchTxt:searchText!  };
}
