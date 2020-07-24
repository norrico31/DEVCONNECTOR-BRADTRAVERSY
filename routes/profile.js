const express = require('express')
const router = express.Router()
const request = require('request')
const config = require('config')
const normalize = require('normalize-url')
const auth = require('../middleware/auth')
const { check, validationResult } = require('express-validator')

const User = require('../models/User')
const Profile = require('../models/Profile')

// @route   GET api/profile/me
// @desc    LogIn users profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])
        if (!profile) return res.status(400).json({ msg: 'There is no profile for this user' })
        return res.json(profile)
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private
router.post('/', [ auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body

    // Build profile object
    const profileFields = {
        user: req.user.id,
        company,
        location,
        website: website && website !== '' ? normalize(website, { forceHttps: true }) : '',
        bio,
        skills: Array.isArray(skills) ? skills : skills.split(',').map(skill => ' ' + skill.trim()),
        status,
        githubusername
    }

    // Build social object and add to profileFields
    const socialfields = { youtube, twitter, instagram, linkedin, facebook }
    for (const [key, value] of Object.entries(socialfields)) {
        if (value && value.length > 0) socialfields[key] = normalize(value, { forceHttps: true })
    }

    // set the values of socialfields to profileFields.social
    profileFields.social = socialfields

    try {
        // Using upsert option (create new doc if no match is found)
        let profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true, upsert: true })
        return res.json(profile)
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        return res.json(profiles)
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})

// @route   GET api/profile/user/:user_id
// @desc    Get Profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'])
        if (!profile) return res.status(400).json({ msg: 'Profile not found' })
        return res.json(profile)
    } catch (err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') return res.status(400).json({ msg: 'Profile not found' })
        return res.status(500).send('Server Error')
    }
})

// @route   DELETE api/profile
// @desc    Delete profile, user and posts
// @access  Private
router.delete('/', auth, async (req, res) => {
    try {
        // @todo - remove users posts

        // Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id })

        await User.findOneAndRemove({ _id: req.user.id })
        
        return res.json({ msg: 'User deleted' })
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})

// @route   Put api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put('/experience', [ auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

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
        const profile = await Profile.findOne({ user: req.user.id })
        profile.experience.unshift(newExp)
        await profile.save()
        return res.json(profile)
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id })

        // Get remove index
        const removeIndex = profile.experience.map(exp => exp.id).indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1)
        await profile.save()
        return res.json(profile)
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})

// @route   Put api/profile/education
// @desc    Add profile education
// @access  Private
router.put('/education', [ auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

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
        const profile = await Profile.findOne({ user: req.user.id })
        profile.education.unshift(newEdu)
        await profile.save()
        return res.status(200).json(profile)
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id })
        foundProfile.education = foundProfile.education.filter(educ => educ._id.toString() !== req.params.edu_id)
        await foundProfile.save()
        return res.status(200).json(foundProfile)
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})


// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public
router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {
                'user-agent': 'node.js'
            }
        }
        request(options, (err, response, body) => {
            if (err) console.error(err)

            if (response.statusCode !== 200) return res.status(404).json({ msg: 'No Github profile found' })

            return res.json(JSON.parse(body))
        })
    } catch (err) {
        console.error(err.message)
        return res.status(500).send('Server Error')
    }
})

module.exports = router