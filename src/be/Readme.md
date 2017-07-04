# Dependencies
Required modules:
* mongodb: database driver.
* jsdom: used for handling DOM to create HTML from the templates.
* multiparty: used when parsing requests to the form api.
* bcrypt: used for encrypting passwords.
* nodemailer: used to send e-mails for people resetting account passwords.
* jsbn: used on ipv6 conversion.
* http-proxy: used on sharding so the master server can act as a reverse-proxy and pass the request to slaves.

The version of each one is specified on the package.json file.

A package.json file is included, so you can install all of them by just running `npm install` on this directory.

# Individual HTML cache
The engine will generate HTML caches for postings and log entries. These caches are for the whole cell containing the posting. Keep that in mind when developing, since it will be used unless the engine is running on front-end debug or debug mode. You can flush them too, the command for doing so is in the list of arguments below.

# Application usage
`boot.js` is the main file, run it using Node.js to start the system. Keep in mind that if you ran `aux/setup.sh`, you can just run the `lynxchan` command or start the `lynxchan` service.
It accepts the following arguments:
* `--debug`, `-d`: for development. Will not cache static files, disable individual HTML caches and reload not only any module besides the ones directly under the be directory but also the front-end templates. It will also cause errors to crash and will clean any file in the temporary directory older than one minute every minute.
* `--tor-debug`, `-td`: tor debug. Will cause any request to be marked as a if it were coming from a TOR exit node.
* `--fe-debug`, `-fd`: front-end debug. Will not cache static files, disable individual HTML caches and reload the front-end templates.
* `--reload`, `-r`: will rebuild all pages on boot.
* `--reload-previews`, `-rp`: will rebuild previews on boot.
* `--reload-login`, `-rl`: will rebuild login page on boot.
* `--reload-banner`, `-rb`: will rebuild default banner on boot.
* `--reload-front`, `-rf`: will rebuild front-page on boot.
* `--reload-notfound`, `-rn`: will rebuild 404 page on boot.
* `--reload-thumb`, `-rt`: will rebuild generic thumbnail on boot.
* `--reload-audio`, `-ra`: will rebuild generic audio thumb on boot.
* `--reload-spoiler`, `-rs`: will rebuild spoiler image on boot.
* `--reload-maintenance`, `-rm`: will rebuild maintenance page on boot.
* `--reload-overboard`, `-ro`: reloads the overboard.
* `--reload-logs`, `-rlog`: reloads logs.
* `--reload-boards`, `-rboard`: reloads boards. If a board uri is informed it will start from the informed board. If an interval is informed it will skip said interval after finishing each board. The board and interval will only be used if the comand to not fork is issued.
* `--reload-front-end`, `-rfe`: reloads the front-end files on a running instance, including cached static files. Will be ignored if maintenance mode is being changed on the same command or if no daemon was not informed.
* `--prune-files`, `-pf`: prunes files that no longer contains references to them. Its advisable to turn on maintenance mode before using this command to avoid race conditions.
* `--reload-graphs`, `-rg`: redraws daily graphs.
* `--no-daemon`, `-nd`: will not start listening to HTTP requests. For running commands while having a server running.
* `--create-account`, `-ca`: will create a new account. Require the use of the login, role and password parameters.
* `--login`, `-l`: informs a login.
* `--no-fork`, `-nf`: prevents the engine from spawning aditional processes to run commands. It will also make the engine stop after a rebuild error. Meant for internal usage, but hey, I`m not your dad or anything to tell you how to use your computer. :^)
* `--password`, `-p`: informs a password.
* `--board`, `-b`: informs a board uri.
* `--thread`, `-t`: informs a thread id. Not threadId, but the document `_id`.
* `--post`, `-po`: informs a post id. Not postId, but the document `_id`.
* `--interval`, `-i`: informs an interval.
* `--global-role`, `-gr`: informs a role from 0 to 4, 0 meaning root user, 1 admin, 2 global volunteer, 3 global janitor and 4 regular user.
* `--set-role`, `-sr`: set a new role for an existing account. Will not be used if `-ca` is used. Takes a login and global role.
* `--maintenance`, `-m`: indicates a new value for maintenance mode on a running instance. The value will be parsed as JSON, so informing `true` or `false` will work, so as informing numbers that evaluate to false or true. Will be ignored if no daemon was not informed.
* `--clear-individual-cache`, `-cc`: clears individual cache of postings and log entries.
* `--shutdown`, `-s`: orders a running instance to shut down. Will be ignored if no daemon was not informed or if either maintenance mode is being changed or if the front-end is being reloaded on the same command.

Arguments that are meant to inform values should be used in the following manner:
`argument value`

Examples:
`lynxchan -r -nd` = rebuild all pages and do not start a server.
`lynxchan -ca -l login -p pass -gr 0` = create an account with login login, password pass with root global role and then start the server.
`lynxchan -rf -rb -nd` = reload the saved front-page and the default banner and do not start a server.

# Directory structure
The json api files will be stored on the `api` directory and accessed by the `/.api/` path. `/.api/function` will use the file `api/function.js`.
The form api for support of users without js because they are retarded tin foilers are in the `form` directory and are accessed using `domain/function.js`.
The `engine` directory will hold all scripts that provide functionality but are not to be accessed directly. There are also some few files directly under the `src/be` directory.
The `addons` directory are used to store the addons that can be loaded. After placing an addon on this directory, it should also be included in the `addons` general setting array.
And finally, the `settings` directory hold the settings files.

The following directories will be expected on the front-end directory:
* `static`: static files to be accessed by using the `/.static/` path.
* `templates`: will hold the templates, so only the files will have to be specified on the settings.

# Ban duration
The syntax for setting ban durations uses the following fields:
* `y`: year.
* `M`: month.
* `d`: day.
* `h`: hour.
* `m`: minute.

So if you write "2d 1h" it will create a 49 hour ban. The order of amounts and spacing doesn`t matter. The same could be "1h 2d".

# Templates
A file called `templateSettings.json` should be located on the front-end directory pointing the correct templates to be used, located on the templates directory. Inform only the name of the file. Refer to `doc/Templates.txt` for information on how to structure the templates.

# SSL
To use SSL, enable the setting `ssl` and place the key file named `ssl.key` and the certificate named `ssl.cert` on the src/be directories. After that, restart the engine. Remember to also inform the key passphrase if it requires one.

# Back-end settings
Settings files that goes into the settings directory:
`general.json`: contains general settings for the application. Holds the following settings:
* `verbose`(Boolean): if true, will activate all verbose modes.
* `disable304`(Boolean): if true, will never use http status 304.
* `address`: ip to bind the server on. Defaults to `0.0.0.0`.
* `port`(Number): port to listen for http. Defaults to 80.
* `ssl`(Boolean): if true, will listen to https on port 443.
* `sslPass`: optional passphrase for the ssl key.
* `fePath`: absolute path to the directory containing the fe files. Defaults to the relative path to the src/fe directory. The directory indicated must have the `templateSettings.json` file. If you are using the front-end at the default path, the template settings must be sitting directly inside the `src/fe` directory.
* `pageSize`(Number): amount of threads on each board page. Defaults to 10.
* `latestPostCount`(Number): number of latest posts to be displayed on each thread in board pages. Defaults to 5.
* `autoSageLimit`(Number): how many posts a thread must hit at once so it becomes impossible to bump. Defaults to 500.
* `maxThreadCount`(Number): maximum amount of threads allowed per board. Defaults to 50.
* `tempDirectory`: path for temporary files. Defaults to `/tmp`.
* `emailSender`: e-mail to be used as sender on automated e-mails. Defaults to `noreply@mychan.com`.
* `captchaExpiration`: expiration in minutes of captchas. Defaults to 5 minutes.
* `siteTitle`: name to be used as the title of the front-page. Defaults to the `titDefaultChanTitle` entry on the language pack.
* `maxRequestSizeMB`: maximum size in megabytes of incoming requests. Defaults to 2MB.
* `maxFileSizeMB`: maximum size in megabytes of individual uploaded files. Defaults to infinity.
* `acceptedMimes`(Array): accepted mimes on uploads. Defaults to `[ 'image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'video/webm', 'audio/mpeg', 'video/mp4', 'video/ogg', 'audio/ogg', 'audio/webm' ]`.
* `maxFiles`(Number): maximum amount of files on each post. Defaults to 3.
* `defaultBanMessage`: default ban message to be used for banned content when the person applying the ban does not submit a message. Defaults to the `miscDefaultBanMessage` entry on the language pack.
* `disableAccountCreation`(Boolean): disables account creation for users.
* `boardCreationRequirement`(Number): minimum global role required for board creation.
* `defaultAnonymousName`: Default anonymous name if none is set for the board. Defaults to the `miscDefaultAnonymous` entry on the language pack.
* `topBoardsCount`(Number): amount of boards to be listed in the top boards. Defaults to 25. 
* `boardsPerPage`(Number): amount of boards to be listed in boards.js. Defaults to 50.
* `torSource`: url to the list of TOR exit nodes ips. Defaults to `https://check.torproject.org/exit-addresses`.
* `languagePackPath`: absolute path to an optional language pack.
* `mediaThumb`(Boolean): if true, videos and music will generate thumbs instead of using the generic ones. Requires ffmpeg installed.
* `maxBoardRules`(Number): maximum amount of rules that board owners can set. Defaults to 20.
* `thumbSize`(Number): maximum size for both width and height for generated thumbnails. Defaults to 128.
* `maintenance`(Boolean): if set to true, the site will refuse any request to dynamic pages or functions used to interact with the system. Only static files and files on gridfs will be output to the user.
* `multipleReports`(Boolean): if true, allows for multiple postings to be reported at once.
* `maxFilters`(Number): maximum amount of filters a board owner can set. Defaults to 20.
* `maxBoardVolunteers`(Number: maximum amount of volunteers a board can have. Defaults to 20.
* `maxBannerSizeKB`(Number): maximum size in kilobytes for board banners. Defaults to 200KB.
* `maxFlagSizeKB`(Number): maximum size in kilobytes for board flags. Defaults to 32KB.
* `floodTimerSec`(Number): time in seconds required between postings from the same ip. Not applicable to TOR users, but applicable to block bypasses. Defaults to 10.
* `maxBoardTags`(Number): maximum amount of tags each board can have. Defaults to 5.
* `disableFloodCheck`(Boolean): indicates if the flood checks should be disabled. This shouldn't affect performance at all, since it's meant to be used for benchmarking purposes.
* `clearIpMinRole`(Number): minimum global role required for users to see non-hashed ips from posts and perform global deletions from ip.
* `thumbExtension`: forces all thumbs to use this extension. Keeps gifs from being animated as a side-effect, even if `gif` is used.
* `allowGlobalBoardModeration`(Boolean): if true, global staff will be allowed to act as board moderators too.
* `addons`(Array): array of addons to be loaded. They will be loaded in the order they appear in this array.
* `useGlobalBanners`(Boolean): indicates if boards should use global banners. 
* `allowBoardCustomJs`(Boolean): if true, boards are allowed to have custom javascript.
* `globalLatestPosts`(Number): amount of global latest posts to be displayed on the front-page.
* `forceCaptcha`(Boolean): makes all boards use captcha.
* `overboard`: uri of the overboard.
* `overBoardThreadCount`(Number): amount of threads that should be shown at the overboard. Defaults to 50.
* `bypassMaxPosts`(Number): how many uses a block bypass will have before expires. Defaults to 30.
* `bypassDurationHours`(Number): how many hours a block bypass will last. Defaults to 24
* `bypassMode`(Number): mode used for bypass. 0 means that it won`t be enabled. 1 means that users caught in range bans and TOR users (if TOR is allowed to use block bypass) will be able to post if they get a bypass token. 2 means that anyone will only be able to post if they get a bypass token. Defaults to 0.
* `multiboardThreadCount`(Number): amount of threads to be displayed on the multi-board. If none is set, multi-board will not be enabled.
* `concurrentRebuildMessages`(Number): maximum amount of concurrent rebuild queue messages being processed.
* `rssDomain`: domain used on links on the RSS feeds. Defaults to ''. 
* `globalLatestImages`(Number): amount of global latest images to be displayed on the front-page.
* `master`: ip of the master.
* `slaves`(Array): ips of the slaves.
* `frontPageStats`(Boolean): indicates if total posts made on existing boards and total unique ips on the last 24 hours should be displayed on the front-page.
* `autoPruneFiles`(Boolean): the engine will run a weekly task that will make it enter maintenance mode, prune files that are no longer in use and then come out of maintenance mode.
* `torPort`(Number): port that when used, will always mark the request as if it came from a TOR ip.
* `sfwOverboard`: uri to be used for the sfw overboard.
* `CSP`: Content security policy directives. Example: `default-src 'self'`
* `onlySfwLatestImages`(Boolean): makes so only SFW images are displayed on the front-page.
* `inactivityThreshold`(Number): amount of days an user must be inactive so he and his boards will be marked as inactive.
* `mediaPageSize`(Number): amount of files to be displayed at once on the media management page. Defaults to 100.
* `messageLength`(Number): character limit for posted messages. Defaults to 4096.
* `ffmpegGifs`(Boolean): indicates if ffmpeg should be used to generate animated gif thumbnails. It yields lower quality thumbnails but they are smaller and are processed much faster.
* `spamIpsSource`: complete url to be used to fetch spammer's ips. It has to be able to be processed by the `unzip` command and contain the ips in plain text separated by commas. Defaults to `https://www.stopforumspam.com/downloads/bannedips.zip`. The ip list is downloaded every midnight UTC or if the file `spamData` can't be found on the `src/be` directory.
* `allowSpamBypass`(Boolean): indicates if people caught in the spam list are allowed to use the block bypass, given the block bypass is not disabled.
* `disableSpamCheck`(Boolean): indicates if the spam check should be skipped. Meant to be used on emergencies where its not possible at all to obtain the spam ip list.
* `disableCatalogPosting`(Boolean): removes the thread creation form from the board`s catalogs.
* `ipExpirationDays`(Number): amount of days to wait before removing the ip from postings counting from it's date of creation. Null or any value below 1 means that ips should never be removed. The schedule that clears the ips is run hourly.
* `torPostingLevel`(Number): indicates the permission level for TOR posting. 0 means no posting at all, 1 means posting with a block bypass and 2 means regular posting.
* `allowTorFiles`(Boolean): when posting, allows TOR users to post files.
* `verboseApis`(Boolean): causes both the json api and the form api to print what is being both input and output.
* `verboseStatic`(Boolean): causes the static file handler to print information of what is serving.
* `verboseGridfs`(Boolean): causes the gridFsHandler to print information about it's operations.
* `verboseQueue`(Boolean): causes the message queue to print information about it's operations.
* `verboseMisc`(Boolean): causes any message being output outside of the other modes to be printed.
* `verboseGenerator`(Boolean): causes the cache generator to print information about it's operations.
* `useAlternativeLanguages`(Boolean): enables checking for user's language so one of the alternative languages can be used for his request.
* `incSpamIpsSource`(Boolean): complete url to be used to fetch latest additions to the spam ip database. Same rules for `spamIpsSource` apply, except that ips are separated by new lines instead of commas. Downloaded every hour. Defaults to `https://www.stopforumspam.com/downloads/listed_ip_1.zip`.
* `flagNameLength`(Number): maximum size allowed for custom flags names. Defaults to 32.
* `allowBlockedToReport`(Boolean): allows users that were banned or blocked to report content, including TOR users if they are not allowed to post.

`db.json`: contains database connection information.
* `address`: address of the database.
* `port`: port the database is using.
* `database`: database to use.
* `user`: login to use on the database.
* `password`: password to use on the database.
* `ssl`(Boolean): will connect to the database using SSL.
`user` is optional and `password` will only be used if login is informed.

Settings files must contain a json object where each key defined here will have its corresponding value.

# GridFS
Meta-data of files on gridfs will have the following values:
* `boardUri`: board to which the file belongs to. If undefined, file is a default site file.
* `lastModified`(Date): date of the last modification of the file.
* `boards`(Array): array of boards present on the multi-board page cache.
* `expiration`(Date): date of the expiration of the file, marking it to be removed.
* `threadId`(Number): id of the thread the file belongs to.
* `compressed`(Boolean): if true, it means the file has or is a compressed version.
* `postId`(Number): id of the post the file belongs to.
* `status`(Number): http status to be used when outputting this page. Defaults to 200 when outputting.
* `date`(Number): date to which the file refers to.
* `identifier`: identifier for media files.
* `languages`(Array): array of languages that this page is aimed at.
* `referenceFile`: version of the default language for a file. Used for alternative language files. 
* `type`: type of file. May hold one of the following values: 
  * `board`
  * `thread` 
  * `media`
  * `captcha` 
  * `banner`
  * `catalog`
  * `preview`
  * `rules`
  * `flag`
  * `log`
  * `multiboard`
  * `graph`
