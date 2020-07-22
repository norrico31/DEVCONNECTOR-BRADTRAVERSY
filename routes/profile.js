const express = require('express')
const router = express.Router()
const normalize = require('normalize-url')
const auth = require('../middleware/auth')
const { check, validationResult } = require('express-validator')

const Profile = require('../models/Profile')

// @route   GET api/profile/me
// @desc    Get current users profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])
        if (!profile) return res.status(400).json({ msg: 'There is no profile for this user' })
        res.json(profile)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error')
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
        res.status(500).send('Server Error')
    }
})

module.exports = router