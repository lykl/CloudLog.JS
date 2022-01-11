import styles from './App.module.scss';
import 'antd/dist/antd.css';
import '@icon-park/react/styles/index.css';
import {Button, Collapse, Input, Select} from 'antd';
import {useEffect, useState} from "react";
import axios from "axios";
import runtime from "./runtime";
import {Alarm, Bug, Caution, CloseOne, Info, Trace} from "@icon-park/react";

const {Option} = Select;
const {Panel} = Collapse;

function App() {
    const backendUrl = '';
    const [collections, setCollections] = useState([]);
    // const [mongoUrl, setMongoUrl] = useState('mongodb://localhost:27017/');
    const [currentShow, setCurrentShow] = useState('');
    const [showNumber, setShowNumber] = useState(100);
    const [currentLog, setCurrentLog] = useState([]);
    const [sourceList, setSourceList] = useState([]);
    const getLog = (collection) => {
        console.log('开始获取');
        let current = collection;
        console.log(current);
        if (current !== '') {
            const data = {
                mongoUrl: runtime.mongoUrl, collection: current, num: showNumber
            }
            axios.post(backendUrl + '/getLog', data).then(r => {
                console.log(r.data);
                setCurrentLog(r.data);
            }).catch(e => {
            })
        } else {
            setCurrentLog([]);
        }
    }

    const handleChange = (value) => {
        console.log(`selected ${value}`);
        if (value === undefined) {
            console.log('reset');
            setCurrentShow('');
            runtime.currentShow = '';
        } else {
            setCurrentShow(value);
            runtime.currentShow = value;
            getLog(runtime.currentShow);
        }
    }

    useEffect(() => {
        setInterval(() => {
            getLog(runtime.currentShow)
        }, 1000);
        if (localStorage.getItem('dataSource')) {
            let currentList = JSON.parse(localStorage.getItem('dataSource'));
            setSourceList(currentList);
        }
    }, [])

    const getAllCollection = () => {
        const data = {
            mongoUrl: runtime.mongoUrl
        }
        axios.post(backendUrl + '/getCollection', data).then(r => {
            console.log(r.data);
            let collectionList = [];
            for (const e of r.data) {
                collectionList.push(e.name);
            }
            console.log(collectionList)
            setCollections(collectionList);
        }).catch(err => {
            console.log(err);
        })
    }

    const connect = (value) => {
        runtime.mongoUrl = value;
        getAllCollection();
    }

    const toSelect = [];
    collections.map(e => {
        const t = <Option value={e} key={e}>{e}</Option>;
        toSelect.push(t);
    })
    const toSourceList = [];
    let count = 0;
    sourceList.map(e => {
        count++;
        const t = <Option value={e.source} key={count}>{e.name}</Option>;
        toSourceList.push(t);
    })
    const showLog = [];
    currentLog.map(e => {
        let title = '';
        title = e.level;
        let time = '';
        let logTime = new Date(e.now);
        time = logTime.toLocaleString('chinese', {hour12: false});
        let info = '';
        info = e.info;
        let color = 'black';
        switch (title) {
            case 'TRACE':
                color = '#005CAF';
                break;
            case 'DEBUG':
                color = '#0089A7';
                break;
            case 'INFO':
                color = '#00896C';
                break;
            case 'WARN':
                color = '#DDA52D';
                break;
            case 'ERROR':
                color = '#AB3B3A';
                break;
            case 'FATAL':
                color = '#E16B8C';
                break;
        }
        let icon = <div/>;
        switch (title) {
            case 'TRACE':
                icon = <Trace theme="filled" size="24" fill={color}/>;
                break;
            case 'DEBUG':
                icon = <Bug theme="filled" size="24" fill={color}/>;
                break;
            case 'INFO':
                icon = <Info theme="filled" size="24" fill={color}/>;
                break;
            case 'WARN':
                icon = <Caution theme="filled" size="24" fill={color}/>;
                break;
            case 'ERROR':
                icon = <CloseOne theme="filled" size="24" fill={color}/>;
                break;
            case 'FATAL':
                icon = <Alarm theme="filled" size="24" fill={color}/>;
                break;
        }
        let showBlank = false;
        if (title === 'INFO' || title === 'WARN') {
            showBlank = true;
        }
        let showLogData = [];
        let hasLogData = false;
        if (e.hasOwnProperty('data')) {
            let dataString = JSON.stringify(e.data, null, '\t');
            console.log(dataString);
            let t = <div>{dataString}</div>
            showLogData.push(t);
            hasLogData = true;
        }
        let t = <div className={styles.logItem}>
            <div className={styles.logTitle}>
                {icon}
                <span className={styles.logTitleText} style={{color: color}}>{title}{showBlank &&
                    <span>{'\u00a0'}</span>}</span>
                <span className={styles.logTitleDate} style={{color: 'rgba(0,0,0,0.7)'}}>{time}</span>
            </div>
            <div>
                <span className={styles.infoText}>
                    {info}
                </span>
            </div>
            <div>{hasLogData && <div><Collapse defaultActiveKey={[]}>
                <Panel header="展示数据" key="1">
                    <pre className={styles.code}>{showLogData}</pre>
                </Panel>
            </Collapse></div>
            }
            </div>
        </div>
        showLog.push(t);
    })

    const AddDataSource = () => {
        let newSource = document.getElementById('mongoInput').value;
        let newSourceName = document.getElementById('nameInput').value;
        let newSourceObj = {name: newSourceName, source: newSource};
        if (localStorage.getItem('dataSource')) {
            let pre = localStorage.getItem('dataSource');
            pre = JSON.parse(pre);
            pre.push(newSourceObj);
            pre = JSON.stringify(pre);
            localStorage.setItem('dataSource', pre);
        } else {
            let arr = [newSourceObj];
            let s = JSON.stringify(arr);
            localStorage.setItem('dataSource', s);
        }
        let currentList = JSON.parse(localStorage.getItem('dataSource'));
        setSourceList(currentList);
    }

    const RemoveDataSource = () => {
        localStorage.removeItem('dataSource');
        setSourceList([]);
        setCollections([]);
        runtime.currentShow = '';
    }

    return (
        <div className="App">
            <div className={styles.head}>
                <span className={styles.title}>CloudLOG</span>
                <div className={styles.option}>
                    <div>
                        <Input id={'mongoInput'} style={{width: 140}} placeholder="数据库链接"/>
                        <Input id={'nameInput'} style={{width: 80}} placeholder="别名"/>
                        <Button onClick={AddDataSource} type="primary">添加数据源</Button>
                    </div>
                    <div style={{padding: '0 0 0 20px'}}>
                        <Select style={{width: 150}} allowClear onChange={connect}>
                            {toSourceList}
                        </Select>
                        <Select style={{width: 150}} allowClear onChange={handleChange}>
                            {toSelect}
                        </Select>
                        <Button onClick={RemoveDataSource} type="primary">清除数据源</Button>
                    </div>
                </div>
            </div>
            <main className={styles.main}>
                <div className={styles.logList}>
                    {showLog}
                </div>
            </main>
        </div>
    );
}

export default App;
