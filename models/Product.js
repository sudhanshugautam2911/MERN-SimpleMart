const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    min: [0, "wrong min price"],
    max: [10000, "wrong max price"],
    required: true,
  },
  discountPercentage: {
    type: Number,
    min: [0, "wrong min discount"],
    max: [99, "wrong max discount"],
  },
  rating: {
    type: Number,
    min: [0, "wrong min rating"],
    max: [5, "wrong max price"],
    default: 0,
  },
  stock: { type: Number, min: [0, "wrong min stock"], default: 0 },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  thumbnail: { type: String, required: true },
  images: { type: [String], required: true },
  colors: { type: String },
//   colors: { type: [Schema.Types.Mixed] },
//   sizes: { type: [Schema.Types.Mixed] },
  sizes: { type: String },
  highlights: { type: [String] },
  discountPrice: { type: Number },
  deleted: { type: Boolean, default: false },
});


// using virtual to convert "_id" to "id" , we need entry with id not _id.
// in DB it will remain "_id" but in virtual it is "id"  (I am more of confuse but I am trying to connect things)
const virtual = productSchema.virtual('id');

productSchema.get(function() {
  return this._id;
})

productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc,ret) { delete ret._id}
})

exports.Product = mongoose.model("Product", productSchema);
