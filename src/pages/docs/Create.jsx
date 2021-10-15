import { CircularProgress } from "@material-ui/core";
import axios from "axios";
import { useEffect } from "react";
import { useHistory } from "react-router-dom";

function CreateForm() {
  const history = useHistory();

  useEffect(() => {
    (async () => {
      await axios
        .get("docs/create")
        .then((res) => {
          history.push("/docs/" + res.data._id);
        })
        .catch((err) => {
          console.log(err, err.response);
        });
    })();
  }, [history]);

  return (
    <div className="center-container">
      <CircularProgress />
    </div>
  );
}

export default CreateForm;
