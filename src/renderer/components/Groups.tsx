import {
  Button,
  Stack,
  Card,
  Navbar,
  InputGroup,
  Row,
  Col,
  Form,
} from 'react-bootstrap';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import NotListedLocationIcon from '@mui/icons-material/NotListedLocation';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { getGropImagePath } from '../commonfunc';

function GroupsPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState([]);
  const navi = useNavigate();
  let bRendring: boolean = false;

  // ページの読み込み時
  useEffect(() => {
    if (bRendring === false) {
      loading(-1);
    }
  }, []);
  // ページロード中の実装をここで、行います。
  async function loading(PARENT_GID: number) {
    bRendring = true;
    const stragesData = await window.electron.doLoadGroups(PARENT_GID);
    setGroups(stragesData);

    // フィルタリング機能
    setSearchQuery(stragesData);

    bRendring = false;
  }

  // グループの詳細画面に遷移
  async function handleDetailClick(GID: number) {
    navi(`/group/${GID}`);
  }
  // Inputのchangeコールバック
  function handleChange(e: any) {
    const { name, value } = e.target;
    // console.log("name", name);
    // console.log("value", value);

    const strSeach = value.toLowerCase();

    // フィルタリング機能
    setSearchQuery(
      groups.filter((group) =>
        group.SearchName.toLowerCase().startsWith(strSeach),
      ),
    );

    return true;
    // setFormValues({ ...formValues, [name]: value });
  }
  function getGroupName(group: any) {
    if (group.SearchName == undefined || group.SearchName == '') {
      return group.Name;
    }
    return group.Name;
  }
  // グループの種類のHTMLを取得
  function getGroupKindHtml(group: any) {
    if (group.Kind == undefined || group.Kind == null) {
      return <NotListedLocationIcon />;
    }
    if (group.Kind == 0) {
      // images
      return <NotListedLocationIcon />;
    }
    if (group.Kind == 1) {
      // images
      return <AudiotrackIcon />;
    }
    if (group.Kind == 2) {
      // images
      return <OndemandVideoIcon />;
    }
    return <NotListedLocationIcon />;
  }
  // グループの種類のHTMLを取得
  function getGroupFavaritHtml(group: any) {
    if (group.Favorite == undefined || group.Favorite == null) {
      return <></>;
    }
    return (
      <>
        <FavoriteBorderIcon /> {group.Favorite}%
      </>
    );
  }

  return (
    <div className="content">
      <div>
        <Navbar className="bg-body-tertiary justify-content-around">
          <Form>
            <Row>
              <Col xs="auto">
                <Form.Control
                  name="searchTxt"
                  type="text"
                  placeholder={t('message.inputQueryString')}
                  className=" mr-sm-2"
                  onChange={(e) => handleChange(e)}
                />
              </Col>
            </Row>
          </Form>
        </Navbar>
      </div>
      <div className="d-flex flex-wrap GroupList">
        {searchQuery.map((group) => (
          <div key={group.GID} onClick={(e) => handleDetailClick(group.GID)}>
            <Card style={{ width: '18rem' }}>
              <Card.Body>
                <Stack direction="horizontal" gap={2}>
                  <Card.Img
                    className="GroupList-img"
                    variant="top"
                    src={getGropImagePath(group)}
                  />
                  <div className="ms-auto">
                    <Stack direction="vertical" gap={2}>
                      <Stack direction="horizontal" gap={2}>
                        <div>{getGroupKindHtml(group)}</div>
                        <div className="ms-auto">
                          {getGroupFavaritHtml(group)}
                        </div>
                      </Stack>

                      <Stack direction="horizontal" gap={2}>
                        <div />
                      </Stack>
                    </Stack>
                  </div>
                </Stack>
                <Card.Title>{getGroupName(group)}</Card.Title>
                <Card.Text>{group.Comment}</Card.Text>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupsPage;
