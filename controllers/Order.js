const { Order } = require("../models/Order");
const { User } = require("../models/User");
const { sendMail, invoiceTemplate } = require("../services/common");

exports.fetchOrderByUser = async (req, res) => {
  const { id } = req.user;
  try {
    const orders = await Order.find({ user: id });
    res.status(200).json(orders);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.createOrder = async (req, res) => {
  const order = new Order(req.body);
  // here we have to update stocks;
  
  // for(let item of order.items){
  //    let product =  await Product.findOne({_id:item.product.id})
  //    product.$inc('stock',-1*item.quantity);
  //    // for optimum performance we should make inventory outside of product.
  //    await product.save()
  // }

  try {
    const doc = await order.save();
    const user = await User.findById(order.user)
     // we can use await for this also 
     sendMail({to:user.email,html:invoiceTemplate(order) ,subject:'Order Received' })
           
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

exports.fetchAllOrders = async (req, res) => {
  // filter = {"category":["smartphone","laptops"]}
  // sort = {_sort:"price",_order="desc"}
  // pagination = {_page:1,_limit=10}

  let query = Order.find({ deleted: { $ne: true } });
  let totalOrdersQuery = Order.find({ deleted: { $ne: true } });

  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
  }

  //   here in backend we dont have 'X-Total-Count' in Header, on frontend we need this so writing this...
  const totalDocs = await totalOrdersQuery.count().exec();

  if (req.query._page && req.query._limit) {
    const pageSize = req.query._limit;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  try {
    const docs = await query.exec();
    res.set("X-Total-Count", totalDocs);
    res.status(200).json(docs);
  } catch (err) {
    res.status(400).json(err);
  }
};
