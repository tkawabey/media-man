import { Button, Stack, Card,Navbar,InputGroup ,
  Row , Col, Form  } from 'react-bootstrap';
import React, { useState, useEffect } from "react";
import { useNavigate, Link  } from 'react-router-dom';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { useTranslation } from "react-i18next";


function GenreMangePage() {
  const { t } = useTranslation();
  const [genres, setGenres] = useState([]);
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
    let stragesData = await window.electron.doLoadGenres();
    setGenres(stragesData);

    //フィルタリング機能
    setSearchQuery(
      stragesData
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
      genres.filter((group:any) =>
        group.Name.toLowerCase().startsWith(strSeach)
      )
    );
    return true;
  }
  return (
    <div className="content">
      <div>
        <Breadcrumb>
          <Breadcrumb.Item href="/groups">Home</Breadcrumb.Item>
          <Breadcrumb.Item active>ジャンル一覧</Breadcrumb.Item>
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
        {searchQuery.map( (genre:any) => (
          <Link key={genre.GENRE_ID} to={`/genre/${genre.GENRE_ID}`}>{genre.Name}</Link>
        ) )}
        </div>
      </div>
    </div>
  );
}

export default GenreMangePage;
