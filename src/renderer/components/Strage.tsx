import { Form, Button, Stack, Dropdown } from 'react-bootstrap';
import React, { useState, useEffect } from "react";
import {  useNavigate  } from 'react-router-dom';
import Table from 'react-bootstrap/Table';
import { useTranslation } from "react-i18next";
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Modal from 'react-bootstrap/Modal';


type STRAGE_DATA = {
  SID: string;
  Path: string;
  status: boolean;
};




let g_procMsg:string[] = [];
let g_errMsg:string[] = [];


// calling IPC exposed from preload script
window.electron.ipcRenderer.on('ipc-import-from-strage', (arg, msg) => {
  let proc:number = parseInt("" + arg);
  let strMsg = '';
  if( proc == 1 )
  {
    strMsg = 'proccessing...';
  }
  else if( proc == 0 )
  {
    strMsg = 'complete.';
  }
  else if( proc == 3 )
  {
    strMsg = "" + msg;
  }
  else if( proc < 0 )
  {
//    strMsg = "" + msg;
    g_errMsg.push("" + msg);
//    g_errMsg.join("<br/>");
  }
  else
  {
    strMsg = "" + msg;
  }


  if( proc >= 0 )
  {
    if( g_procMsg.length > 20 )
    {
      g_procMsg.shift()
    }
    g_procMsg.push(strMsg);

    document.getElementById("prcocces-msg")!.innerHTML = g_procMsg.join("<br/>");
  }
  else
  {
    if( g_errMsg.length > 20 )
    {
      g_errMsg.shift()
    }
    document.getElementById("err-msg")!.innerHTML = g_errMsg.join("<br/>");
  }


});



//---------------------------------
function StragePage() {
  // 多言語対応
  const { t } = useTranslation();
  const INIT_STRAGE_DATA:STRAGE_DATA[] = [];
  const [strages, setStrages] = useState(INIT_STRAGE_DATA);

  const [showAddStrage, setShowAddStrage] = useState(false);
  const initialValues = { SID: "", Path: "" };
  const [formValues, setFormValues] = useState(initialValues);
  const [formErros, setFormErrors] = useState({});



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
    let stragesData = await window.electron.doLoadStrages();
    let reBuildData:STRAGE_DATA[] = [];
    for(let strageData of stragesData)
    {
      strageData.status = await window.electron.isExistPath( strageData.Path ) as boolean;
      reBuildData.push({
        SID: strageData.SID,
        Path: strageData.Path,
        status: strageData.status
      });
    }
    setStrages(reBuildData);
    bRendring = false;
  }

  // AddボタンのonClickハンドラー
  const handleAddBtnClick = async () => {
    navi('/strage/new');
  }
  // 再読み込みボタンのonClickハンドラー
  async function handleClickReload()
  {
    loading()
  }

  // 削除ボタンのonClickハンドラー
  async function handleDelClick(SID:string)
  {
    let result = await window.electron.doDelStrages(SID);
    loading()
  }

  // メディアフォルダーを探索してメディア情報を収集ボタンのonClickハンドラー実装
  const handleClickImports = async () => {
    g_procMsg = [];
    g_errMsg = [];
    document.getElementById("prcocces-msg")!.innerHTML = "";
    document.getElementById("err-msg")!.innerHTML = "";

    window.electron.ipcRenderer.sendMessage('ipc-import-from-strage', ['']);
  }
  // 前画面に戻るボタン
  const handleHistoryBack = async () => {
    navi(-1);
  }
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {t("strage.toolTipAddStatrage")}
    </Tooltip>
  );


  // 入力値の妥当性をチェックします。
  const validate = (values:any) => {
    const errors:any = {};
    if (!values.SID) {
      errors.SID = "SIDを入力してください。";
    }
    if (!values.Path) {
      errors.Path = "Pathを入力してください。";
    }
    return errors;
  }


  // Inputのchangeコールバック
  function  handleChange(e:any)
  {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  }

  // SubmitボタンのonClickハンドラー
  async function onClickedAddStrage(e:any)
  {
    e.preventDefault();
    let errors:any = validate(formValues);
    setFormErrors(errors);
    if( Object.keys(errors).length === 0 ) {
      // DBにストレージを登録します。
      let result = await window.electron.doAddStrages(formValues.SID, formValues.Path);
      // モーダル画面を閉じる
      setShowAddStrage(false);
      // ロードし直します。
      loading();
    }
  }



  return (
    <div className="content">

      <Stack direction="horizontal" gap={3}>
        <Stack direction="horizontal" gap={2}>
          <h4>{t("strage.title")}</h4>
        </Stack>


        <OverlayTrigger
            placement="left-end"
            delay={{ show: 250, hide: 400 }}
            overlay={renderTooltip}     >
          <Button variant="outline-primary"   className="ms-auto" onClick={ ()=> {setShowAddStrage(true);} } ><PlaylistAddIcon/></Button>
        </OverlayTrigger>
        <div className="vr" />
        <Button variant="outline-secondary"  onClick={ handleClickReload } ><RestartAltIcon/></Button>
      </Stack>



        {/* AddGroup */}
        <div key='add-group-dlg'>
          <Modal show={showAddStrage}
                backdrop="static"
                keyboard={false}
                onHide={() => setShowAddStrage(false)}
          >
            <Form>
              <Modal.Header >
                  <Modal.Title>メディアフォルダーの追加</Modal.Title>
              </Modal.Header>
              <Modal.Body>

                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput1">
                  <Form.Label>キーワード</Form.Label>
                  <Form.Control type="text" placeholder="SID" key="SID" name='SID' defaultValue=""
                    onChange={(e) => handleChange(e)}  />

                  <p className="errorMsg">{formErros.SID}</p>
                </Form.Group>

                <Form.Group className="mb-3" controlId="DbPropForm.ControlInput2">
                  <Form.Label>	メディアフォルダー</Form.Label>
                  <Form.Control type="text" placeholder="Path" key="Path" name='Path' defaultValue=""
                    onChange={(e) => handleChange(e)}  />

                  <p className="errorMsg">{formErros.Path}</p>
                </Form.Group>

              </Modal.Body>
              <Modal.Footer>
                <Button  variant="primary" onClick={(e) => onClickedAddStrage(e)}>追加</Button>
                <Button  variant="secondary" onClick={() => setShowAddStrage(false)}>{t("commonTitle.close")}</Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </div>


      <div className="todos">
      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>#</th>
            <th>{t("strage.keyword")}</th>
            <th>{t("strage.path")}</th>
            <th>{t("strage.status")}</th>
            <th>#</th>
          </tr>
        </thead>
        <tbody>

          {strages.map( (strage) => (
            <tr key={strage.SID}>
                <td></td>
                <td>{strage.SID}</td>
                <td>{strage.Path}</td>
                <td>{ strage.status ? t("message.canUsed") : t("message.canotBeUsed") }</td>
                <td><Button variant="outline-danger"   onClick={ (e) => handleDelClick(strage.SID) }  ><DeleteForeverIcon/></Button></td>
            </tr>
          ) )}

        </tbody>
        </Table>
        <div>
          <Stack direction="vertical" gap={3}>
             <Button  variant="outline-primary"  onClick={ handleClickImports } ><LibraryAddIcon/>{t("strage.explore")}</Button>

             <p id="err-msg" className="errorMsg"></p>
             <p id="prcocces-msg"></p>
          </Stack>
        </div>


      </div>
    </div>
  );
}

export default StragePage;
