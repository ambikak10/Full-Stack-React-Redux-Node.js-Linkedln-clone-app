const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const request = require('request');
const config = require('config');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
 
   const { 
   company,
   location,
   website,
   bio,
   skills,
   status,
   githubusername,
   youtube,
   twitter,
   instagram,
   linkedin,
   facebook
} = req.body;
  

// Build profile object 
const profileFields = {};
profileFields.user = req.user.id;
if(company) profileFields.company = company;
if (location) profileFields.location = location;
if (website) profileFields.website = website;
if (bio) profileFields.bio = bio;
if (status) profileFields.status = status;
if (githubusername) profileFields.githubusername = githubusername;
if (skills) {
  profileFields.skills = skills.split(',').map(skill => skill.trim());
}

 profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;


// Update Profile 
try {
  let profile = await Profile.findOne({ user: req.user.id});
  if (profile) {
    let profile = await Profile.findOneAndUpdate(
    { user: req.user.id }, 
    { $set: profileFields }, 
    { new: true }
    );
    return res.json(profile);
  }
// Create profile
  profile = new Profile(profileFields);
  await profile.save();
  res.json(profile);

} catch (err) {
  console.error(err.message);
  res.status(500).send('Server Error');
}

});

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public

router.get('/', async(req, res) => {
    try{
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
    } catch(err) {
      console.error(err.message)
      res.status(500).send('Server Error');
    }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user_id
// @access   Public

router.get('/user/:user_id', async(req, res) => {
try {
  const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name', 'avatar']);
  if (!profile) {
    return res.status(400).json({ msg: 'There is no profile for this user' });
  }
  res.json(profile);
  console.log(profile);
 
} catch (err) {
  console.error(err.message);
  if(err.kind == 'ObjectId'){
    console.log(err.kind);
    return res.status(400).json({ msg: 'Profile not found' });
  }
  res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile
// @desc     Delete profile, user and post
// @access   Public
router.delete('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({user: req.user.id});
    await User.findOneAndRemove({ _id: req.user.id });
    console.log(_id);
    res.json({ msg : 'User deleted'});
  } catch {
    console.error(err.message)
    res.status(500).send('Server Error');
  }
});
// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Public
  router.put('/experience', [auth,
    [
      check('title', 'title is required').not().isEmpty(),
      check('company', 'company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty()
    ]], 
    async (req, res) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()){
        res.status(400).json({ errors: errors.array() });
      }
      const {
       title,
       company,
       location,
       from,
       to,
       current,
       description
      } = req.body
    
      const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      }
      
      try {
        const profile = await Profile.findOne({ user: req.user.id});
        // const experience = await Profile.findOne( profile.experience._id)
        // console.log(experience);
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
      } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
      }
    }
  );
// try {
//   let profile = await Profile.findOne({ user: req.user.id });
//   if (profile) {
//     let profile = await Profile.findOneAndUpdate(
//       { user: req.user.id },
//       { $set: profile.experience },
//       { new: true }
//     );
//     return res.json(profile);
//   }
//   // Create profile
//   profile.experience.unshift(newExp);
//         await profile.save();
//         res.json(profile);

// } catch (err) {
//   console.error(err.message);
//   res.status(500).send('Server Error');
// }
//     });

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete profile experience
// @access   Private

router.delete('/experience/:exp_id', auth, async(req, res) =>{
 try {
  const profile = await Profile.findOne({user: req.user.id});
  const removeIndex =  profile.experience.map(item => item.id).indexOf(req.params.exp_id);
  profile.experience.splice(removeIndex, 1); 
  await profile.save();
  res.json(profile);
 } catch (err) {
   console.error(err.message);
   res.status(500).send('Server Error');
  }
});
// @route    PUT api/profile/education
// @desc     Add education to the profile
// @access   Private

router.put('/education', [auth,
  [
    check('school', 'school is required').not().isEmpty(),
    check('degree', 'degree is required').not().isEmpty(),
    check('fieldofstudy', 'fieldofstudy date is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
  ]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      // const experience = await Profile.findOne( profile.experience._id)
      // console.log(experience);
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
)


// @route    DELETE api/profile/education/
// @desc     delete education
// @access   Private
router.delete('/education/:education_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.education_id);
    console.log(removeIndex);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public

router.get('/github/:username', (req, res)=> {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js'}
    };
    request(options, (error, response, body)=> {
      if(error) console.error(error);

      if(response.statusCode !=200) {
        return res.status(404).json({ msg: 'No Github profile found'});
      }
      res.json(JSON.parse(body));
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
  
});

module.exports = router;

