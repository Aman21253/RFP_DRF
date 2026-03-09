import { useEffect, useState } from "react";
import API from "../api/api";

function Dashboard() {

  const [rfps, setRfps] = useState([]);

  useEffect(() => {

    const token = localStorage.getItem("access");

    API.get("vendor/rfp/", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((res) => {

      setRfps(res.data);

    });

  }, []);

  return (

    <div>

      <h2>Vendor RFP List</h2>

      {rfps.map((rfp) => (

        <div key={rfp.id}>

          <h3>{rfp.title}</h3>

          <p>{rfp.min_amount} - {rfp.max_amount}</p>

        </div>

      ))}

    </div>

  );

}

export default Dashboard;