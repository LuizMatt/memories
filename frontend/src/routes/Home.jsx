import axios from "../axios-config";
import { useState, useEffect } from "react";
import "./Home.css";
import { Link } from "react-router-dom";

const Home = () => {
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    const getMemories = async () => {
      const response = await axios.get("/memories");
      setMemories(response.data);
    };

    getMemories();
  }, []);

  return (
    <div className="home">
      <h2>Confira as últimas memórias</h2>
      <div className="memories-container">
        {memories.length > 0 &&
          memories.map((memory) => (
            <div className="memory" key={memory._id}>
              <img
                src={`${axios.defaults.baseURL}/${memory.image}`}
                alt={memory.title}
              />
              <p>{memory.title}</p>
              <Link className="btn" to={`/memories/${memory._id}`}>Comentar</Link>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Home;
  
