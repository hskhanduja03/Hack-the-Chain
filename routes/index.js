var express = require('express');
var router = express.Router();
const userModel=require("./users");
const complaintModel = require("./complaints")
const passport=require("passport");
const upload=require("./multer");
const cloudinary = require("../utils/cloudinary");


const localStratergy=require("passport-local");
passport.use(new localStratergy(userModel.authenticate()));


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home');
});




//Register Route
router.post('/register', async (req, res) => {
  const { username, email, fullname, rollNo } = req.body;
  const defaultProfileImage = "default.png";
  const userData = new userModel({ username, email, fullName: fullname, rollNo, profileImage: defaultProfileImage});

  await userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("home");
      });
    })
    .catch(function (err) {
      // Handle any registration errors here
      console.error("Registration error:", err);
      res.redirect("/register"); // Redirect to a registration error page or form
    });
});


router.get("/login",checkAuthenticated, function(req,res){
  res.render("login",{});
});

router.get("/register",checkAuthenticated,function(req,res){
  res.render("register",{});
});


router.get("/registerComplaint", isLoggedIn, function(req,res){
  res.render("registerComplaint",{});
});


router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login"
}), function(req, res) {
});


router.get("/home", async function(req,res){
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("home",{user});
});

router.post('/createComplaint', async function(req, res) {
    const user=await userModel.findOne({username:req.session.passport.user});
  
    const complaint=await complaintModel.create({
      createdBy:user._id,
      title:req.body.title,
      content:req.body.content,
      category:req.body.category,
    })
  
      user.complaints.push(complaint._id);
      await user.save();
      res.redirect('/allcomplaint');
      // res.json(complaint);
  });

  router.get("/allcomplaint", isLoggedIn, async function(req, res) {
    const complaints = await complaintModel.find().populate("createdBy");




    const user = await userModel.findOne({username: req.session.passport.user }).populate("complaints");
    res.render('allcomplaint',{user, complaints}); // Pass 'user' object here
});


router.get("/profile", isLoggedIn, async function(req,res){
  const error = req.query.error;
  const user = await userModel.findOne({username: req.session.passport.user}).populate("complaints");
  res.render("profile",{user, error});
});

router.get("/newcomplaint", isLoggedIn, async function(req,res){
  // const user = await userModel.findOne({username: req.session.passport.user}).populate("complaints");
  res.render("newcomplaint",{});
});


router.get("/logout",function(req,res){
  req.logout(function(err){
    if(err){ return next(err); }
    res.redirect("/login");
  });
});



function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

function checkAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    res.redirect("/");
  }
  return next();
}




// router.post('/update',upload.single('image'), async function(req, res) {
//   const user=await userModel.findOneAndUpdate(
//     {username:req.session.passport.user},
//     {new:true}
//     );

//     user.profileImage=req.file.filename;
//     await user.save();
//     res.redirect('/profile');
// });


//  ++++++++++++++++ more updated
// router.post('/update', upload.single('image'), async function(req, res) {

//   try {
//     if (!req.file) {
//       return res.redirect('/profile?error=No%20file%20uploaded'); // Redirect with error message
//     }

//     const user = await userModel.findOneAndUpdate(
//       { username: req.session.passport.user },
//       { profileImage: req.file.filename },
//       { new: true }
//     );

//     if (!user) {
//       throw new Error('User not found');
//     }
//     return res.redirect('/profile?error=Success');
//   } catch (error) {
//     console.error('Error updating user profile:', error);
//     res.status(400).send(error.message); // Respond with a 400 status code and error message
//   }
// });





// ++++++++++++    cloudinary version

router.post('/update', upload.single('image'), async function(req, res) {
  try {
    if (!req.file) {
      return res.redirect('/profile?error=No%20file%20uploaded'); 
    }

    const result = await cloudinary.uploader.upload(req.file.path);

    if (!result) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const user = await userModel.findOneAndUpdate(
      { username: req.session.passport.user },
      { profileImage: result.url },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return res.redirect('/profile?success=Image%20updated%20successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }
});








router.get('/complaint/:id', async (req, res) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    const userdetails=await complaintModel.findById(req.params.id).populate("upvotes");
    if (!complaint) {
      return res.status(404).send('Complaint not found');
    }

    const user = await userModel.findOne({username: req.session.passport.user})
    res.render('complaintDetails', { complaint, user, userdetails});
  } catch (error) {
    console.error('Error retrieving complaint details:', error);
    res.status(500).send('Internal Server Error. Try logging in again &nbsp;<button><a href="/login">login</a></button>');
  }
});


router.get('/upvote/:id', async (req, res)=>{
  const user=await userModel.findOne({username:req.session.passport.user});
  const complaint=await complaintModel.findById(req.params.id);

  // res.json(user);
  // res.json(complaint);
  if(complaint.upvotes.indexOf(user._id)===-1){
    complaint.upvotes.push(user._id);
   } 
   else{
    complaint.upvotes.splice(complaint.upvotes.indexOf(user._id) , 1);
   }
   await complaint.save();
   res.redirect(`/complaint/${req.params.id}`);
  })

router.get('/user/:id', async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).populate("complaints");
    if (!user) {
      return res.status(404).send('Complaint not found');
    }

    // Render the complaint details page with the complaint data
    res.render('userProfile', { user});
  } catch (error) {
    console.error('Error retrieving complaint details:', error);
    res.status(500).send('Internal Server Error');
  }
});



  
  // Server-side route to render the next page and display the selected option
router.get('/next-page', (req, res) => {
  const selectedOption = req.session.selectedOption;
  res.render('newcomplaint', {selectedOption});
});
router.post('/store-option', (req, res) => {
  const selectedOption = req.body.selectedOption;
  req.session.selectedOption = selectedOption;
  res.sendStatus(200); // Send a success response
});


module.exports = router;
