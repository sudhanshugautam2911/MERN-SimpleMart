const { User } = require("../models/User");

exports.fetchUserById = async (req, res) => {
  if (req.user) {
    const { id } = req.user;
    console.log(id);
    try {
      const user = await User.findById(id);
      res
        .status(200)
        .json({
          id: user.id,
          addresses: user.addresses,
          email: user.email,
          role: user.role,
        });
    } catch (err) {
      res.status(400).json(err);
    }
  }
};
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  console.log("id of updated user: ", id);

  try {
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    console.log("user update : ", user);
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};
