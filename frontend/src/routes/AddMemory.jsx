import React from "react";
import axios from "../axios-config";
import { useState } from "react";
import "./AddMemory.css";

import { toast } from "react-toastify";

import { useNavigate } from "react-router-dom";

const AddMemory = () => {
  const [inputs, setInputs] = useState({
    title: "",
    description: "",
  });

  const [image, setImage] = useState(null);

  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", inputs.title);
    formData.append("description", inputs.description);
    formData.append("image", image);

    try {
      const response = await axios.post("/memories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Memória criada com sucesso!");

      navigate("/");
    } catch (error) {
      console.error("Erro ao enviar a memória:", error);
      toast.error(error.response?.data?.msg || "Erro ao enviar a memória");
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "image") {
      const file = e.target.files[0];
      setImage(file);
    } else {
      setInputs({ ...inputs, [e.target.name]: e.target.value });
    }
  };

  return (
    <div className="add-memory-page">
      <h2>Crie uma nova memória</h2>
      <form onSubmit={handleSubmit}>
        <label>
          <p>Título</p>
          <input
            type="text"
            placeholder="Defina um título"
            name="title"
            onChange={handleChange}
          />
        </label>
        <label>
          <p>Descrição</p>
          <textarea
            placeholder="Descrição da memória"
            name="description"
            onChange={handleChange}
          ></textarea>
        </label>
        <label>
          <p>Foto: </p>
          <input type="file" name="image" onChange={handleChange} />
        </label>
        <input type="submit" className="btn" value="Enviar" />
      </form>
    </div>
  );
};

export default AddMemory;
