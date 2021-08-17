import { useHistory, useLocation, useRouteMatch, Route, Switch } from "react-router-dom";
import { AppBar, Toolbar, Typography, IconButton, Tooltip, Box, CircularProgress } from "@material-ui/core";
import { ExitToApp, Close, Done } from "@material-ui/icons";
import axios from "axios";

import { useContext, useEffect, useState } from "react";
import { userContext } from "../../App";

import Folders from "./Folders";
import NotFound from "../NotFound";
import Files from "./Files";

import { nanoid } from "nanoid";

function CircularProgressWithLabel(props) {
  return (
    <Box position="relative" display="inline-flex">
      {props.value !== 100 && <CircularProgress size={30} variant="determinate" {...props} />}
      <Box top={0} left={0} bottom={0} right={0} position="absolute" display="flex" alignItems="center" justifyContent="center">
        {props.value === 100 ? (
          <Done style={{ fill: "#00FFFF", marginRight: 20 }} />
        ) : (
          <Typography style={{ fontSize: 9 }} variant="caption" component="div" color="textSecondary">
            {`${props.value}%`}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function CloseBtn(props) {
  useEffect(() => {
    setTimeout(() => setFilesUploading([]), 5000);
  });
  const { setFilesUploading } = props;

  return <Close onClick={() => setFilesUploading([])} style={{ cursor: "pointer" }} />;
}

function DriveRoute() {
  useEffect(() => {
    document.querySelector("link[rel='shortcut icon']").href = "https://i.imgur.com/Cr3oZGy.png";
  }, []);

  const { currentUser, handleSignOut } = useContext(userContext);

  const { path } = useRouteMatch();

  const history = useHistory();
  const location = useLocation();

  const [filesUploading, setFilesUploading] = useState([]);

  const uploadFile = async (file, parentId) => {
    let formData = new FormData();
    let id = nanoid();
    formData.append("file", file);

    setFilesUploading((prevFilesUploading) => [
      ...prevFilesUploading,
      {
        id,
        name: file.name,
        percentage: 0,
      },
    ]);

    axios
      .post(process.env.REACT_APP_UPLOAD_SERVER + "upload", formData, {
        onUploadProgress: (progress) => {
          let percentage = Math.round((progress.loaded / progress.total) * 100);

          setFilesUploading((prevFilesUploading) => {
            let clone = [...prevFilesUploading];
            let child = clone.find((e) => e.id === id);
            child.percentage = percentage;
            return clone;
          });
        },
      })
      .then((res) => {
        axios.post("drive/create-file", {
          name: file.name,
          parentId,
          userId: currentUser.id,
          url: res.data.url,
          type: file.type,
        });

        try {
          const bc = new BroadcastChannel("channel");
          bc.postMessage("update");
        } catch (error) {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <>
      {!location.pathname.startsWith("/drive/file") && (
        <AppBar position="static" color="transparent" elevation={1}>
          <Toolbar>
            <IconButton onClick={() => history.push("/drive")} edge="start" color="inherit" aria-label="menu">
              <img height={30} src="https://i.imgur.com/Cr3oZGy.png" />
            </IconButton>
            <div style={{ flexGrow: 1 }}>
              <Typography onClick={() => history.push("/drive")} variant="h6" style={{ cursor: "pointer", display: "inline" }}>
                Google Drive Minified
              </Typography>
            </div>
            {currentUser && (
              <Tooltip title="Sign out">
                <IconButton onClick={handleSignOut} color="secondary">
                  <ExitToApp />
                </IconButton>
              </Tooltip>
            )}
          </Toolbar>
        </AppBar>
      )}
      {filesUploading.length > 0 && (
        <div className="upload-progress-box">
          <div className="upload-progress-header">
            <p> Uploading {filesUploading.length} file</p>
            {filesUploading.every((e) => e.percentage === 100) && <CloseBtn setFilesUploading={setFilesUploading} />}
          </div>

          <div style={{ maxHeight: 150, overflow: "auto" }}>
            {filesUploading.map((e) => (
              <div className="upload-progress-row" key={e.id}>
                <p>{e.name}</p>
                <CircularProgressWithLabel value={e.percentage} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Switch>
        <Route path={`${path}/file/:id`} component={Files}></Route>
        <Route path={`${path}`} exact>
          <Folders uploadFile={uploadFile} />
        </Route>
        <Route path={`${path}/folder/:id`} children={<Folders uploadFile={uploadFile} />}></Route>
        <Route path={`${path}/*`}>
          <NotFound />
        </Route>
      </Switch>
    </>
  );
}

export default DriveRoute;