const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category:{
        type: String,
        required: true,
        enum: ['Network', 'Mess', 'Academic']
    },
    status:{
        type: String,
        required: true,
        enum: ['Resolved', 'Pending'],
        default: 'Pending' 
    },
    content: {
        type: String,
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    dateModified: {
        type: Date,
        default: Date.now
    },
    upvotes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});


complaintSchema.pre('findOneAndDelete', { document: true }, async function() {
    const complaint = this;

    try {
        // Find the user who created the complaint
        const user = await User.findById(complaint.createdBy);

        // Remove the complaint from the user's complaints array
        user.complaints.pull(complaint._id);

        // Save the user document
        await user.save();
    } catch (error) {
        console.error('Error removing complaint from user:', error);
    }
});



module.exports = mongoose.model('Complaint', complaintSchema);
