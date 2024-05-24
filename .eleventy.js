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
		return `<div class="card">
	<a href="/fruit/${ID}">
		<div class="card-preview">
			<img src="/fruit/${ID}/thumbnail.jpg" decoding="async" loading="lazy">
		</div>
	</a>`;
	};

	makeStars = (rating) => {
		return Array(rating).fill("🟊").join("");
	};

	makeReview = (data) => {
		return `<div class="review">
	<div class="reviewer"></div>
	<div>
		<div class="review-header"">
			<p class="review-attribution">
				Avaliação por <strong>${"author" in data ? data.author : "Matheus Avellar" }</strong>
			</p>
			<div class="review-rating">
				${"rating" in data ? makeStars(data.rating) : ""}
			</div>
		</div>
		<p class="review-text">${data.text}</p>
	</div>
</div>`;
	};
};