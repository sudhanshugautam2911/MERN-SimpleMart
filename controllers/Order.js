const { Order } = require("../models/Order");

exports.fetchOrderByUser = async (req, res) => {
  const { user } = req.query;
  try {
    const orders = await Order.find({ user: user });
    console.log("cartitems ", cartItems);
    res.status(200).json(cartItems);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.createOrder = async (req, res) => {
  //   const { id } = req.user;
  const order = new Order(req.body);
  try {
    const doc = await order.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
    const doc = await Order.findByIdAndDelete(id);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateOrder = async (req, res) => {
    const { id } = req.params;
    try {
      const order = await Order.findByIdAndUpdate(id, req.body, {
        new: true,
      });
  
      res.status(200).json(order);
    } catch (err) {
      res.status(400).json(err);
    }
  };
