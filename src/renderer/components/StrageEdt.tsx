import { Button, Stack, Card, Col, Form, Row   } from 'react-bootstrap';
import React, { useState, useEffect } from "react";
const btnImport= document.getElementById('import');
import { useNavigate  } from 'react-router-dom';


function StrageEdtPage() {
  const initialValues = { SID: "", Path: "" };
  const [formValues, setFormValues] = useState(initialValues);
  const [formErros, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);

  const navi = useNavigate();
  let bRendring : boolean = false;

  // ページの読み込み時
  useEffect( () => {
    if( bRendring == false )
    {
      loading();
    }
  }, [formErros]);

  // ページロード中の実装をここで、行います。
  async function loading() {
    bRendring = true;

    bRendring = false;
  }

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
  async function handleSubmitClick(e:any)
  {
    e.preventDefault();
    let errors:any = validate(formValues);
    setFormErrors(validate(formValues));
    if( Object.keys(errors).length === 0 ) {
      let result = await window.electron.doAddStrages(formValues.SID, formValues.Path);


      navi('/strages');
    }
  }




  return (
    <div className="content">
      <Form>
      <Form.Group as={Row} className="mb-3" controlId="form-SID">
        <Form.Label column sm={2}>
          SID
        </Form.Label>
        <Col sm={10}>
          <Form.Control name="SID" type="text" placeholder="SID"
            value={formValues.SID}
            onChange={(e) => handleChange(e)} />
        </Col>
      </Form.Group>
      <p className="errorMsg">{formErros.SID}</p>
      <Form.Group as={Row} className="mb-3" controlId="form-path">
        <Form.Label column sm={2}>
          Path
        </Form.Label>
        <Col sm={10}>
         <Form.Control name="Path" type="text" placeholder="Path"
            value={formValues.Path}
            onChange={(e) => handleChange(e)}  />
        </Col>
      </Form.Group>
      <p className="errorMsg">{formErros.Path}</p>
      <Form.Group as={Row} className="mb-3">
        <Col sm={{ span: 10, offset: 2 }}>
          <Button type="submit"  onClick={ (e) => handleSubmitClick(e) } >Add</Button>
        </Col>
      </Form.Group>
    </Form>
    </div>
  );
}

export default StrageEdtPage;
