import axios from "../axios-config";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import "./Memory.css";

import { toast } from "react-toastify";

const Memory = () => {
  const { id } = useParams();

  const [memory, setMemory] = useState(null);
  const [comments, setComments] = useState([]);

  const [name, setName] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    const getMemory = async () => {
      const res = await axios.get(`/memories/${id}`);
      setMemory(res.data);
      setComments(res.data.comments);
    };
    getMemory();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const comment = {
        name,
        text,
      };

      const res = await axios.patch(
        `/memories/${memory._id}/comment/`,
        comment
      );

      const lastComment = res.data.memory.comments.pop();
      setComments((comments) => [...comments, lastComment]);

      setName("");
      setText("");

      toast.success(res.data.message);
    } catch (error) {
      console.error(error); 
      toast.error(
        error.response?.data?.message || "Erro ao enviar o comentário!"
      );
    }
  };

  if (!memory) return <div>Carregando...</div>;

  return (
    <div className="memory-page">
      <img
        src={`${axios.defaults.baseURL}/${memory.image}`}
        alt={memory.title}
      />
      <h2>{memory.title}</h2>
      <p>{memory.description}</p>
      <div className="comment-form">
        <h3>Comentar: </h3>
        <form onSubmit={handleSubmit}>
          <label>
            <input
              type="text"
              placeholder="Digite seu nome: "
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </label>
          <label>
            <textarea
              placeholder="Digit eseu comentário"
              onChange={(e) => setText(e.target.value)}
              value={text}
            ></textarea>
          </label>
          <label>
            <input type="submit" value="Enviar" className="btn" />
          </label>
        </form>
      </div>
      <div className="comments-container">
        <h3>Comentários ({comments.length})</h3>
        {comments.length > 0 &&
          comments.map((comment) => (
            <div className="comment" key={comment._id}>
              <p className="comment-name">{comment.name}</p>
              <p className="comment-text">{comment.text}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Memory;
