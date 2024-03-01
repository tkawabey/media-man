import { Navbar, Row , Col, Form  } from 'react-bootstrap';
import { useState, useEffect } from "react";
import { useNavigate, Link  } from 'react-router-dom';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useTranslation } from "react-i18next";


function TagMangePage() {
  const { t } = useTranslation();
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState([]);
  const navi = useNavigate();
  let bRendring : boolean = false;

  // ページの読み込み時
  useEffect( () => {
    if( bRendring == false )
    {
      loading(-1);
    }
  }, []);
  // ページロード中の実装をここで、行います。
  async function loading(PARENT_GID:number) {
    bRendring = true;
    let tagsData = await window.electron.doLoadTags();
    setTags(tagsData);

    //フィルタリング機能
    setSearchQuery(
      tagsData
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
      tags.filter((tag:any) =>
      tag.Name.toLowerCase().startsWith(strSeach)
      )
    );
    return true;
  }

  return (
    <div className="content">
      <div>
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <Breadcrumb.Item active>タグ一覧</Breadcrumb.Item>
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
      <div className="d-flex flex-wrap item-info-content">
      <div className="item">
        {searchQuery.map( (tag:any) => (
          <Link key={tag.TAG_ID} to={`/tag/${tag.TAG_ID}`}>{tag.Name}</Link>
        ) )}
        </div>
      </div>
    </div>
  );
}

export default TagMangePage;
