const mongoose = require('mongoose');
const {Schema} = mongoose;


const orderSchema = new Schema({
    items: { type: [Schema.Types.Mixed], required: true },
    totalAmount: {type: Number, },
    totalItems: {type: Number, },
    size: {type : Schema.Types.Mixed},
    color: { type : Schema.Types.Mixed},
    user: { type: Schema.Types.ObjectId, ref: 'User',  required: true },

    // TODO: we can use enum types for payment method
    paymentMethod: { type: String , required: true},
    selectedAddresses: { type: Schema.Types.Mixed, required: true },
    status: { type: String, default: 'pending'},

})

const virtual  = orderSchema.virtual('id');
virtual.get(function(){
    return this._id;
})
orderSchema.set('toJSON',{
    virtuals: true,
    versionKey: false,
    transform: function (doc,ret) { delete ret._id}
})


exports.Order = mongoose.model('Order',orderSchema)