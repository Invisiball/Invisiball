module.exports = {
	Apps: {}, /**< Stores mini-apps in app like Express. */
	Auths: {
		Google: {}, /**< Google authentication. */
		Facebook: {}, /**< Facebook authentication. */
		Twitter: {} /**< Twitter authentication. */
	}, /**< Authetications. */
	Configs: {
		Global: {
			Address: {} /**< Address to listen to configs. */
		} /**< Global configs. */
	}, /**< Configuration variables. */
	Console: {}, /**< Console stuff. */
	Databases: {}, /**< Databases. */
	Emails: {
		Google: {} /**< Google email. */
	}, /**< Admin / bot emails. */
	Jobs: {}, /**< CRON jobs. */
	Modules: {}, /**< Modules required. */
	Utils: {}, /**< Utilities. */
	Vars: {} /**< Variables and utilities. */
}; /**< Our app. */
