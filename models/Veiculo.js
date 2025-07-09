// models/Veiculo.js
import mongoose from 'mongoose';

const veiculoSchema = new mongoose.Schema({
  modelo: { type: String, required: true },
  ano: { type: Number, required: true },
  destaque: String,
  imagemUrl: String
});

const Veiculo = mongoose.model('Veiculo', veiculoSchema);
export default Veiculo;
