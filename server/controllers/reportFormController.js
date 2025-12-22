const ReportFormTemplate = require('../models/ReportFormTemplate');

const DEFAULT_TEMPLATE_NAME = 'Default';

const defaultDefinition = {
    weekday: {
        visibleSections: [
            'ministryActivities',
            'bibleStudy',
            'spiritualDiscipline',
            'serviceAttendance',
            'serviceAttendanceExtras',
            'otherActivities'
        ],
        requiredFields: [
            'date', 'name', 'country', 'church',
            'evangelism_hours', 'people_reached', 'contacts_received',
            'bible_study_sessions', 'bible_study_attendants', 'newcomers',
            'meditation_hours', 'prayer_hours',
            'sermons_listened', 'articles_written'
        ]
    },
    weekend: {
        visibleSections: [
            'serviceAttendance',
            'sundayCoreMessage',
            'otherActivities',
            'planNextWeek'
        ],
        requiredFields: [
            'date', 'name', 'country', 'church',
            'sermon_reflection'
        ]
    }
};

async function ensureDefaultTemplate() {
    const existing = await ReportFormTemplate.findOne({ where: { name: DEFAULT_TEMPLATE_NAME } });
    if (existing) return existing;
    return ReportFormTemplate.create({
        name: DEFAULT_TEMPLATE_NAME,
        definition: defaultDefinition,
        is_active: true
    });
}

exports.getActive = async (req, res) => {
    try {
        let active = await ReportFormTemplate.findOne({ where: { is_active: true } });
        if (!active) {
            active = await ensureDefaultTemplate();
        }
        return res.json(active);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

exports.list = async (req, res) => {
    try {
        const templates = await ReportFormTemplate.findAll({ order: [['createdAt', 'DESC']] });
        return res.json(templates);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, definition } = req.body;
        if (!name || !definition) {
            return res.status(400).json({ msg: 'name and definition are required' });
        }

        const created = await ReportFormTemplate.create({
            name,
            definition,
            is_active: false
        });

        return res.json(created);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        const template = await ReportFormTemplate.findByPk(req.params.id);
        if (!template) return res.status(404).json({ msg: 'Template not found' });

        const { name, definition } = req.body;
        await template.update({
            name: typeof name === 'string' ? name : template.name,
            definition: definition ?? template.definition
        });

        return res.json(template);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

exports.remove = async (req, res) => {
    try {
        const template = await ReportFormTemplate.findByPk(req.params.id);
        if (!template) return res.status(404).json({ msg: 'Template not found' });
        if (template.is_active) {
            return res.status(400).json({ msg: 'Cannot delete the active template. Activate another template first.' });
        }
        await template.destroy();
        return res.json({ msg: 'Deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

exports.activate = async (req, res) => {
    try {
        const template = await ReportFormTemplate.findByPk(req.params.id);
        if (!template) return res.status(404).json({ msg: 'Template not found' });

        await ReportFormTemplate.update({ is_active: false }, { where: { is_active: true } });
        await template.update({ is_active: true });

        return res.json(template);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};

exports.getDefaults = async (req, res) => {
    try {
        return res.json({ name: DEFAULT_TEMPLATE_NAME, definition: defaultDefinition });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
};
