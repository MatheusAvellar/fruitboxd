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
		rating = Number(rating) || 0
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

	makeReview = (obj) => {
		const data = obj.data;
		let date = "date" in data ? data.date : "data desconhecida";
		// `date` às vezes é Date, às vezes já vem formatado(?)
		if(date instanceof Date)
			date = formatDate(date);

		const review_text = obj.content.trim();
		const rating = "rating" in data ? clampRating(data.rating) : "";
		const estrelas = "estrela" + (rating > 1 ? "s" : "");

		return `<div class="review">
	<div class="reviewer">
		<img src="/assets/profile.jpg">
	</div>
	<div>
		<div class="review-header"">
			<div class="review-header-top">
				<a href="${obj.url}" class="review-attribution">
					Avaliação por ${
						"author" in data
						? '<strong>' + data.author + '</strong>'
						: "anônimo"
					}
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
};