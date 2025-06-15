import User from '../models/user.model.js';
import Message from '../models/message.model.js';

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error('Error fetching users for sidebar:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const getMessages = async (req, res) => {
    try {
        const { userId: userToChatId } = req.params;
        const loggedInUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: loggedInUserId, recieverId: userToChatId },
                { senderId: userToChatId, recieverId: loggedInUserId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { userId: recieverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            recieverId,
            text,
            image: imageUrl
        });

        await newMessage.save();

        //todo real time socketio

        res.status(201).json({
            message: 'Message sent successfully',
            data: newMessage
        });

    } catch (error) {
        console.error('Error sending message:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
