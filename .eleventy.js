module.exports = function(eleventyConfig) {
	website_domain = "fruitboxd.avl.la";

	eleventyConfig.addPassthroughCopy("assets");
	eleventyConfig.addPassthroughCopy("CNAME");
	// [Ref] https://github.com/11ty/eleventy/issues/2461#issuecomment-1238279042
	eleventyConfig.addPassthroughCopy("{,!(_site)/**/}*.png");
	eleventyConfig.addPassthroughCopy("{,!(_site)/**/}*.jpg");
	eleventyConfig.addPassthroughCopy("{,!(_site)/**/}*.pdf");
	eleventyConfig.addPassthroughCopy("{,!(_site)/**/}*.svg");

	fallback = function(obj, key, if_false="") {
		if(!(key in obj)) return if_false;
		const val = obj[key];
		if(typeof val === "undefined"
			|| val === null
			|| (typeof val === "number" && isNaN(val)))
			return if_false;

		if("dont_show" in obj && [obj.dont_show].flat().includes(key))
			return if_false;

		return (typeof val === "string" ? val.trim() : val);
	}

	const titleCase = (str) => {
		str = `${str}`;
		return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
	};
	dateify = (date) => {
		if(date instanceof Date)
			return date;
		if(!date)
			return null;
		return new Date(`${date}T00:00Z`);
	};

	getDatePrecision = (date) => {
		return (date instanceof Date) ? 2 : (typeof date === "number" ? 0 : 1);
	};

	formatDate = (date, circa) => {
		const d = dateify(date);
		if(!d) return "S.d.";

		const ye = new Intl.DateTimeFormat("pt-br", { year: "numeric", timeZone: "UTC" }).format(d);
		const mo = new Intl.DateTimeFormat("pt-br", { month: "long", timeZone: "UTC" }).format(d);
		const da = new Intl.DateTimeFormat("pt-br", { day: "numeric", timeZone: "UTC" }).format(d);

		const count = (date instanceof Date) ? 2 : (typeof date === "number" ? 0 : 1);
		if(!circa) {
			if(count >= 2)
				return `${da} de ${mo} de ${ye}`;
			if(count === 1)
				return `${titleCase(mo)} de ${ye}`;
			return `${ye}`;
		} else {
			if(count >= 2)
				return `Circa ${da} de ${mo} de ${ye}`;
			if(count === 1)
				return `Circa ${mo} de ${ye}`;
			return `c.${ye}`;
		}
	};
	getYearsSince = (date, ago=true) => {
		const d =dateify(date);
		if(!d) return `? anos${ago ? " atrás" : ""}`;
		const start_year = d.getUTCFullYear();
		const current_year = (new Date()).getUTCFullYear();
		const delta_years = current_year - start_year;
		return `${delta_years} ano${delta_years >= 2 ? "s" : ""}${ago ? " atrás" : ""}`;
	};

	getYearFromDate = (date, circa) => {
		const d = dateify(date);
		if(!d) return "S.d.";
		// Se é só ano e aproximado, então "c.XXXX"
		if(typeof date === "number" && circa)
			return "c." + d.getUTCFullYear();
		// Caso contrário, o ano é conhecido, então só "XXXX"
		return d.getUTCFullYear();
	};

	// Remove acentos e troca espaços por _
	normalize = text =>
		text.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replaceAll(" ", "_")

	makeCard = (item, hyperlink_tag=true) => {
		const ID = item.fileSlug;
		const name = "name" in item.data ? item.data.name : "";
		return `<div class="card">
	<a href="/fruit/${ID}">
		<div class="card-preview">
			<img alt="${name}" src="/fruit/${ID}/thumbnail.jpg" decoding="async" loading="lazy">
		</div>
	</a>`;
	};

	clampRating = (rating) => {
		rating = Number(rating) || 0.5;
		rating = Math.max(0.5, Math.min(rating, 5));
		const integer = Math.floor(rating);
		if(rating > integer)
			return integer + 0.5;
		return integer;
	};

	makeStars = (rating) => {
		if(!rating) return "";
		const integer = Math.floor(rating);
		const star_svg = `<img class="star-icon" src="/assets/star.svg">`;
		const stars = Array(integer).fill(star_svg).join("");
		if(rating > integer)
			return stars + "<span class='half-star'>½</span>";
		return stars;
	};
	makeUnicodeStars = (rating) => {
		rating = clampRating(rating);
		const integer = Math.floor(rating);
		return Array(integer).fill("★").join("") + (rating > integer ? "½" : "");
	};

	getAuthorFromUsername = (args, username) => {
		const users = args?.users || {};
		return username in users
			? users[username].name
			: username;
	};

	makeReview = (args, obj) => {
		const data = obj.data;
		const username = data?.username || "";
		const author = getAuthorFromUsername(args, username);

		let date = "date" in data ? data.date : "data desconhecida";
		// `date` às vezes é Date, às vezes já vem formatado(?)
		if(date instanceof Date)
			date = formatDate(date);

		const review_text = obj.content.trim();
		const rating = "rating" in data ? clampRating(data.rating) : "";

		const estrelas = "estrela" + (rating > 1 ? "s" : "");

		return `<div class="review">
	<div class="reviewer">
		<img src="/assets/avatar/${username}.jpg">
	</div>
	<div>
		<div class="review-header"">
			<div class="review-header-top">
				<a href="${obj.url}" class="review-attribution">
					Avaliação por <strong>${author}</strong>
				</a>
				<div aria-label="${rating} ${estrelas}" class="review-rating">
					${makeStars(rating)}
				</div>
			</div>
			<p class="review-date">Consumido em ${date}</p>
		</div>
		<p class="review-text">${review_text}</p>
	</div>
</div>`;
	};

	makeOpenGraph = function(args) {
		const url = args.page.url;
		if(args.layout.startsWith("review")) {
			const fruit = args.name;
			const rating = args.rating;
			//console.log(args);
			//const author = args.author;
			const author = getAuthorFromUsername(args, args.username);
			const fruit_url = url.replace(`/${args.username}`, "");
			return `
<meta name="description" content="A fruit review by ${author}.">

<meta property="og:type" content="website">
<meta property="og:url" content="https://fruitboxd.avl.la${url}">
<meta property="og:title" content="A ${makeUnicodeStars(rating)} review of ${fruit}">
<meta property="og:description" content="A fruit review by ${author}.">
<meta property="og:image" content="https://fruitboxd.avl.la${fruit_url}backdrop.jpg">
<meta property="og:image:width" content="1020">
<meta property="og:image:height" content="768">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@aveiiar">
<meta name="twitter:url" content="https://fruitboxd.avl.la${url}">
<meta name="twitter:title" content="Review of ‘${fruit}’ ${makeUnicodeStars(rating)}">
<meta name="twitter:description" content="A fruit review by ${author}.">
<meta name="twitter:label1" content="Reviewed by">
<meta name="twitter:data1" content="${author}">
<meta name="twitter:label2" content="Rating">
<meta name="twitter:data2" content="${makeUnicodeStars(rating)}">
<meta name="twitter:image" content="https://fruitboxd.avl.la${fruit_url}backdrop.jpg">`;

		} else if(args.layout.startsWith("fruit")) {

			const fruit = args.name;
			return `
<meta name="description" content="Fruta cadastrada no Fruitboxd.">

<meta property="og:type" content="website">
<meta property="og:url" content="https://fruitboxd.avl.la${url}">
<meta property="og:title" content="${fruit}">
<meta property="og:description" content="Fruta cadastrada no Fruitboxd.">
<meta property="og:image" content="https://fruitboxd.avl.la${url}backdrop.jpg">
<meta property="og:image:width" content="1020">
<meta property="og:image:height" content="768">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@aveiiar">
<meta name="twitter:url" content="https://fruitboxd.avl.la${url}">
<meta name="twitter:title" content="${fruit}">
<meta name="twitter:description" content="Fruta cadastrada no Fruitboxd.">
<meta name="twitter:image" content="https://fruitboxd.avl.la${url}backdrop.jpg">`;

		} else {
			return `
<meta name="description" content="Fruit reviews!">

<meta property="og:type" content="website">
<meta property="og:url" content="https://fruitboxd.avl.la/">
<meta property="og:title" content="Fruitboxd">
<meta property="og:description" content="Fruit reviews!">
<!--<meta property="og:image" content="https://fruitboxd.avl.la/...">
<meta property="og:image:width" content="1020">
<meta property="og:image:height" content="768">-->

<meta name="twitter:card" content="summary">
<meta name="twitter:site" content="@aveiiar">
<meta name="twitter:url" content="https://fruitboxd.avl.la">
<meta name="twitter:title" content="Fruitboxd">
<meta name="twitter:description" content="Fruit reviews!">
<!--<meta name="twitter:image" content="https://fruitboxd.avl.la/">-->`;
		}
	};
};