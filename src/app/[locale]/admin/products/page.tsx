"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/image-utils";
import toast from "react-hot-toast";
import {
	Package,
	Search,
	Eye,
	RefreshCw,
	Filter,
	Plus,
	Pencil,
	Trash2,
	Star,
	StarOff,
	ToggleLeft,
	ToggleRight,
	Upload,
	Download,
	X,
	Loader2,
	ChevronDown,
	AlertTriangle,
	FileJson,
	Check,
	ImagePlus,
	Film,
	Sparkles,
	FileSpreadsheet,
	FolderTree,
} from "lucide-react";
import FileUploadField from "@/components/common/FileUploadField";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Category {
	id: string;
	slug: string;
	nameEn: string;
	nameZh: string;
	nameJa?: string;
	nameAr?: string;
	image?: string | null;
	parentId?: string | null;
	_count?: { products: number };
	children?: Category[];
}

interface Product {
	id: string;
	slug: string;
	sku: string;
	nameEn: string;
	nameZh: string;
	nameJa: string;
	nameAr: string;
	descEn: string;
	descZh: string;
	descJa: string;
	descAr: string;
	priceUsd: number;
	moq: number;
	leadTimeDays: number;
	images: string;
	specsJson: string;
	videoUrl: string | null;
	pdfUrl: string | null;
	published: boolean;
	featured: boolean;
	status: string;
	categoryId: string;
	category: { id: string; slug: string; nameEn: string } | null;
	createdAt: string;
	updatedAt: string;
}

type FormData = {
	nameEn: string;
	nameZh: string;
	nameJa: string;
	nameAr: string;
	descEn: string;
	descZh: string;
	descJa: string;
	descAr: string;
	sku: string;
	priceCny: string;
	priceUsd: string;
	moq: string;
	leadTimeDays: string;
	categoryId: string;
	images: string;
	specsJson: string;
	videoUrl: string;
	pdfUrl: string;
	featured: boolean;
	published: boolean;
	status: string;
};

const CNY_TO_USD_RATE = 0.137;

const EMPTY_FORM: FormData = {
	nameEn: "",
	nameZh: "",
	nameJa: "",
	nameAr: "",
	descEn: "",
	descZh: "",
	descJa: "",
	descAr: "",
	sku: "",
	priceCny: "0",
	priceUsd: "0",
	moq: "1",
	leadTimeDays: "30",
	categoryId: "",
	images: "[]",
	specsJson: "{}",
	videoUrl: "",
	pdfUrl: "",
	featured: false,
	published: true,
	status: "draft",
};

const STATUS_COLORS: Record<string, string> = {
	published: "bg-green-100 text-green-800 ring-green-600/20",
	draft: "bg-gray-100 text-gray-600 ring-gray-500/20",
	archived: "bg-orange-100 text-orange-800 ring-orange-600/20",
};

const STATUS_LABELS: Record<string, string> = {
	published: "已发布",
	draft: "草稿",
	archived: "已归档",
};

const BATCH_TEMPLATE = [
	{
		nameEn: "Marine Diesel Engine 200HP",
		nameZh: "船用柴油发动机 200马力",
		nameJa: "船舶用ディーゼルエンジン 200馬力",
		nameAr: "محرك ديزل بحري 200 حصان",
		descEn: "High-performance marine diesel engine...",
		descZh: "高性能船用柴油发动机...",
		descJa: "高性能船舶用ディーゼルエンジン...",
		descAr: "محرك ديزل بحري عالي الأداء...",
		sku: "MDE-200HP-001",
		priceUsd: 15000,
		moq: 1,
		leadTimeDays: 45,
		categoryId: "<category-uuid>",
		images: "[]",
		specsJson: '{"power":"200HP","fuel":"Diesel"}',
		videoUrl: "",
		pdfUrl: "",
		featured: false,
		published: true,
		status: "draft",
	},
];

const CSV_TEMPLATE_HEADERS = [
	"SKU",
	"产品名称(中文)",
	"Product Name(EN)",
	"名前(JA)",
	"الاسم(AR)",
	"描述(中文)",
	"Description(EN)",
	"价格(CNY)",
	"分类",
	"起订量",
	"交货天数",
	"图片URL",
];

const CSV_TEMPLATE_EXAMPLE = [
	"MDE-200HP-001",
	"船用柴油发动机 200马力",
	"Marine Diesel Engine 200HP",
	"船舶用ディーゼルエンジン 200馬力",
	"محرك ديزل بحري 200 حصان",
	"高性能船用柴油发动机",
	"High-performance marine diesel engine",
	"100000",
	"发动机",
	"1",
	"45",
	"https://example.com/img1.jpg",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getFirstImage(images: string): string | null {
	try {
		const arr = JSON.parse(images);
		return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
	} catch {
		return null;
	}
}

function flattenCategories(cats: Category[]): Category[] {
	const flat: Category[] = [];
	const walk = (list: Category[], depth: number) => {
		for (const c of list) {
			flat.push({
				...c,
				nameEn: "—".repeat(depth) + (depth ? " " : "") + c.nameEn,
			});
			if (c.children?.length) walk(c.children, depth + 1);
		}
	};
	walk(cats, 0);
	return flat;
}

/* ------------------------------------------------------------------ */
/*  Category Management Modal                                         */
/* ------------------------------------------------------------------ */

function CategoryManagerModal({
	onClose,
	onUpdate,
}: {
	onClose: () => void;
	onUpdate: () => void;
}) {
	const [cats, setCats] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editCat, setEditCat] = useState<Category | null>(null);
	const [form, setForm] = useState({
		nameEn: "",
		nameZh: "",
		nameJa: "",
		nameAr: "",
		parentId: "",
	});
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchCats = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/categories");
			const data = await res.json();
			setCats(data.categories ?? []);
		} catch {
			/* empty */
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchCats();
	}, []);

	const openCreate = () => {
		setEditCat(null);
		setForm({ nameEn: "", nameZh: "", nameJa: "", nameAr: "", parentId: "" });
	};

	const openEdit = (c: Category) => {
		setEditCat(c);
		setForm({
			nameEn: c.nameEn,
			nameZh: c.nameZh || "",
			nameJa: c.nameJa || "",
			nameAr: c.nameAr || "",
			parentId: c.parentId || "",
		});
	};

	const handleSave = async () => {
		if (!form.nameEn.trim()) return toast.error("英文名称必填");
		setSaving(true);
		try {
			const method = editCat ? "PUT" : "POST";
			const body = editCat ? { id: editCat.id, ...form } : form;
			const res = await fetch("/api/admin/categories", {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "保存失败");
			}
			toast.success(editCat ? "分类已更新" : "分类已创建");
			setEditCat(null);
			setForm({ nameEn: "", nameZh: "", nameJa: "", nameAr: "", parentId: "" });
			fetchCats();
			onUpdate();
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "保存失败");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		setDeletingId(id);
		try {
			const res = await fetch(`/api/admin/categories?id=${id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "删除失败");
			}
			toast.success("分类已删除");
			fetchCats();
			onUpdate();
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "删除失败");
		} finally {
			setDeletingId(null);
		}
	};

	const allFlat = flattenCategories(cats);
	const inputCls =
		"w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="fixed inset-0 bg-black/40" onClick={onClose} />
			<div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<FolderTree className="w-5 h-5 text-primary-600" /> 分类管理
					</h3>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* Form */}
					<div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
						<h4 className="text-sm font-semibold text-gray-700">
							{editCat ? `编辑分类: ${editCat.nameEn}` : "新建分类"}
							{editCat && (
								<button
									onClick={openCreate}
									className="ml-3 text-xs text-primary-600 hover:underline"
								>
									+ 新建
								</button>
							)}
						</h4>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-xs text-gray-500 mb-1">
									英文名称 *
								</label>
								<input
									className={inputCls}
									value={form.nameEn}
									onChange={(e) =>
										setForm((p) => ({ ...p, nameEn: e.target.value }))
									}
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 mb-1">
									中文名称
								</label>
								<input
									className={inputCls}
									value={form.nameZh}
									onChange={(e) =>
										setForm((p) => ({ ...p, nameZh: e.target.value }))
									}
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 mb-1">
									日文名称
								</label>
								<input
									className={inputCls}
									value={form.nameJa}
									onChange={(e) =>
										setForm((p) => ({ ...p, nameJa: e.target.value }))
									}
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 mb-1">
									阿拉伯文名称
								</label>
								<input
									className={inputCls}
									value={form.nameAr}
									onChange={(e) =>
										setForm((p) => ({ ...p, nameAr: e.target.value }))
									}
								/>
							</div>
						</div>
						<div>
							<label className="block text-xs text-gray-500 mb-1">
								父级分类
							</label>
							<select
								className={inputCls}
								value={form.parentId}
								onChange={(e) =>
									setForm((p) => ({ ...p, parentId: e.target.value }))
								}
							>
								<option value="">无（顶级分类）</option>
								{allFlat
									.filter((c) => c.id !== editCat?.id)
									.map((c) => (
										<option key={c.id} value={c.id}>
											{c.nameEn}
										</option>
									))}
							</select>
						</div>
						<div className="flex justify-end">
							<button
								onClick={handleSave}
								disabled={saving}
								className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
							>
								{saving && <Loader2 className="w-4 h-4 animate-spin" />}
								{editCat ? "保存修改" : "创建分类"}
							</button>
						</div>
					</div>

					{/* List */}
					{loading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
						</div>
					) : cats.length === 0 ? (
						<p className="text-center text-gray-400 text-sm py-8">暂无分类</p>
					) : (
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-xs text-gray-500 border-b">
									<th className="pb-2">名称 (EN)</th>
									<th className="pb-2">名称 (ZH)</th>
									<th className="pb-2 text-center">产品数</th>
									<th className="pb-2 text-right">操作</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{allFlat.map((c) => (
									<tr key={c.id} className="hover:bg-gray-50">
										<td className="py-2 font-medium text-gray-800">
											{c.nameEn}
										</td>
										<td className="py-2 text-gray-600">{c.nameZh}</td>
										<td className="py-2 text-center text-gray-500">
											{c._count?.products ?? 0}
										</td>
										<td className="py-2 text-right space-x-2">
											<button
												onClick={() => openEdit(c)}
												className="text-primary-600 hover:text-primary-800"
												title="编辑"
											>
												<Pencil className="w-4 h-4 inline" />
											</button>
											<button
												onClick={() => handleDelete(c.id)}
												disabled={deletingId === c.id}
												className="text-red-500 hover:text-red-700 disabled:opacity-50"
												title="删除"
											>
												{deletingId === c.id ? (
													<Loader2 className="w-4 h-4 inline animate-spin" />
												) : (
													<Trash2 className="w-4 h-4 inline" />
												)}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Modal                                         */
/* ------------------------------------------------------------------ */

function DeleteModal({
	product,
	onClose,
	onConfirm,
	deleting,
}: {
	product: Product;
	onClose: () => void;
	onConfirm: () => void;
	deleting: boolean;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="fixed inset-0 bg-black/40" onClick={onClose} />
			<div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
						<AlertTriangle className="w-5 h-5 text-red-600" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-gray-900">删除产品</h3>
						<p className="text-sm text-gray-500">此操作无法撤销。</p>
					</div>
				</div>
				<p className="text-sm text-gray-700 mb-6">
					确定要删除 <span className="font-semibold">{product.nameEn}</span>{" "}
					(SKU: {product.sku})？
				</p>
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						disabled={deleting}
						className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						disabled={deleting}
						className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
					>
						{deleting && <Loader2 className="w-4 h-4 animate-spin" />}
						确认删除
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Product Form Modal (Create / Edit)                                */
/* ------------------------------------------------------------------ */

interface UploadingFile {
	id: string;
	file: File;
	progress: number;
	status: "uploading" | "done" | "error";
	url?: string;
	error?: string;
}

function ProductFormModal({
	product,
	categories,
	onClose,
	onSaved,
}: {
	product: Product | null;
	categories: Category[];
	onClose: () => void;
	onSaved: () => void;
}) {
	const isEdit = !!product;
	const [form, setForm] = useState<FormData>(() => {
		if (!product) return EMPTY_FORM;
		const usdVal = product.priceUsd ?? 0;
		return {
			nameEn: product.nameEn,
			nameZh: product.nameZh ?? "",
			nameJa: product.nameJa ?? "",
			nameAr: product.nameAr ?? "",
			descEn: product.descEn ?? "",
			descZh: product.descZh ?? "",
			descJa: product.descJa ?? "",
			descAr: product.descAr ?? "",
			sku: product.sku,
			priceCny: String(Math.round((usdVal / CNY_TO_USD_RATE) * 100) / 100),
			priceUsd: String(usdVal),
			moq: String(product.moq),
			leadTimeDays: String(product.leadTimeDays),
			categoryId: product.categoryId ?? "",
			images: product.images ?? "[]",
			specsJson: product.specsJson ?? "{}",
			videoUrl: product.videoUrl ?? "",
			pdfUrl: product.pdfUrl ?? "",
			featured: product.featured,
			published: product.published,
			status: product.status ?? "draft",
		};
	});
	const [saving, setSaving] = useState(false);
	const [translating, setTranslating] = useState(false);
	const [activeTab, setActiveTab] = useState<
		"general" | "descriptions" | "media" | "advanced"
	>("general");
	const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
	const [uploadingVideo, setUploadingVideo] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const videoInputRef = useRef<HTMLInputElement>(null);

	const set = (key: keyof FormData, value: string | boolean) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	// Auto-translate Chinese fields → en/ja/ar
	const handleAutoTranslate = async () => {
		const hasName = !!form.nameZh.trim();
		const hasDesc = !!form.descZh.trim();
		if (!hasName && !hasDesc) {
			toast.error("请先填写中文名称或中文描述");
			return;
		}
		setTranslating(true);
		try {
			const texts: Record<string, string> = {};
			if (hasName) texts.nameZh = form.nameZh;
			if (hasDesc) texts.descZh = form.descZh;

			const res = await fetch("/api/admin/translate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					texts,
					from: "zh",
					targets: ["en", "ja", "ar"],
				}),
			});
			if (!res.ok) throw new Error("翻译请求失败");
			const data = await res.json();
			const t = data.translated as Record<string, Record<string, string>>;

			setForm((prev) => ({
				...prev,
				...(t.en?.nameEn ? { nameEn: t.en.nameEn } : {}),
				...(t.en?.descEn ? { descEn: t.en.descEn } : {}),
				...(t.ja?.nameJa ? { nameJa: t.ja.nameJa } : {}),
				...(t.ja?.descJa ? { descJa: t.ja.descJa } : {}),
				...(t.ar?.nameAr ? { nameAr: t.ar.nameAr } : {}),
				...(t.ar?.descAr ? { descAr: t.ar.descAr } : {}),
			}));
			toast.success("自动翻译完成，请检查并修正");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "翻译失败");
		} finally {
			setTranslating(false);
		}
	};

	const setCnyPrice = (cny: string) => {
		const cnyNum = parseFloat(cny) || 0;
		const usd = Math.round(cnyNum * CNY_TO_USD_RATE * 100) / 100;
		setForm((prev) => ({ ...prev, priceCny: cny, priceUsd: String(usd) }));
	};

	// --- Image helpers ---
	const imageList: string[] = (() => {
		try {
			const arr = JSON.parse(form.images);
			return Array.isArray(arr) ? arr : [];
		} catch {
			return [];
		}
	})();

	const setImageList = (imgs: string[]) => set("images", JSON.stringify(imgs));

	const removeImage = (idx: number) => {
		const next = [...imageList];
		next.splice(idx, 1);
		setImageList(next);
	};

	const addImages = (urls: string[]) => {
		setImageList([...imageList, ...urls]);
	};

	const uploadFiles = async (files: FileList | File[]) => {
		const validExts = new Set(["jpg", "jpeg", "png", "webp", "svg"]);
		const toUpload: UploadingFile[] = [];
		for (const file of Array.from(files)) {
			const ext = file.name.split(".").pop()?.toLowerCase() || "";
			if (!validExts.has(ext)) {
				toast.error(`不支持的格式: ${file.name}`);
				continue;
			}
			if (file.size > 10 * 1024 * 1024) {
				toast.error(`文件过大: ${file.name} (最大10MB)`);
				continue;
			}
			toUpload.push({
				id: `${Date.now()}-${Math.random()}`,
				file,
				progress: 0,
				status: "uploading",
			});
		}
		if (!toUpload.length) return;
		setUploadingFiles((prev) => [...prev, ...toUpload]);

		const newUrls: string[] = [];
		for (const item of toUpload) {
			try {
				const fd = new globalThis.FormData();
				fd.append("file", item.file);
				const res = await fetch("/api/upload", { method: "POST", body: fd });
				if (!res.ok)
					throw new Error(
						(await res.json().catch(() => ({}))).error || "上传失败",
					);
				const data = await res.json();
				newUrls.push(data.url);
				setUploadingFiles((prev) =>
					prev.map((f) =>
						f.id === item.id
							? { ...f, status: "done", url: data.url, progress: 100 }
							: f,
					),
				);
			} catch (e: unknown) {
				setUploadingFiles((prev) =>
					prev.map((f) =>
						f.id === item.id
							? {
									...f,
									status: "error",
									error: e instanceof Error ? e.message : "上传失败",
							  }
							: f,
					),
				);
			}
		}
		if (newUrls.length) addImages(newUrls);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
	};

	const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const ext = file.name.split(".").pop()?.toLowerCase() || "";
		if (!["mp4", "webm"].includes(ext)) {
			toast.error("仅支持 mp4、webm 格式");
			return;
		}
		if (file.size > 50 * 1024 * 1024) {
			toast.error("视频最大50MB");
			return;
		}
		setUploadingVideo(true);
		try {
			const fd = new globalThis.FormData();
			fd.append("file", file);
			const res = await fetch("/api/upload", { method: "POST", body: fd });
			if (!res.ok)
				throw new Error(
					(await res.json().catch(() => ({}))).error || "上传失败",
				);
			const data = await res.json();
			set("videoUrl", data.url);
			toast.success("视频上传成功");
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "视频上传失败");
		} finally {
			setUploadingVideo(false);
		}
	};

	// --- AI image optimize (gentle brightness/contrast only, preserves original content) ---
	const optimizeImage = async (imgUrl: string, idx: number) => {
		try {
			toast.loading("AI优化中...", { id: "ai-opt" });
			const img = document.createElement("img");
			img.crossOrigin = "anonymous";
			img.src = imgUrl;
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = reject;
			});

			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext("2d")!;

			// Draw original image with gentle brightness/contrast (no background fill, no overlay)
			ctx.filter = "brightness(1.05) contrast(1.08) saturate(1.03)";
			ctx.drawImage(img, 0, 0);
			ctx.filter = "none";

			const blob = await new Promise<Blob>((resolve, reject) =>
				canvas.toBlob(
					(b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
					"image/jpeg",
					0.95,
				),
			);

			const fd = new globalThis.FormData();
			fd.append("file", blob, `optimized-${Date.now()}.jpg`);
			const res = await fetch("/api/upload", { method: "POST", body: fd });
			if (!res.ok) throw new Error("上传优化图片失败");
			const data = await res.json();

			const next = [...imageList];
			next[idx] = data.url;
			setImageList(next);
			toast.success("图片优化完成", { id: "ai-opt" });
		} catch {
			toast.error("图片优化失败，请确保图片来源支持跨域访问", { id: "ai-opt" });
		}
	};

	const handleSubmit = async () => {
		if (!form.nameEn.trim()) return toast.error("请填写英文名称");
		if (!form.sku.trim()) return toast.error("请填写SKU编号");
		if (!form.categoryId) return toast.error("请选择产品分类");

		setSaving(true);
		try {
			const payload = {
				nameEn: form.nameEn,
				nameZh: form.nameZh,
				nameJa: form.nameJa,
				nameAr: form.nameAr,
				descEn: form.descEn,
				descZh: form.descZh,
				descJa: form.descJa,
				descAr: form.descAr,
				sku: form.sku,
				priceUsd: parseFloat(form.priceUsd) || 0,
				moq: parseInt(form.moq) || 1,
				leadTimeDays: parseInt(form.leadTimeDays) || 30,
				categoryId: form.categoryId,
				images: form.images,
				specsJson: form.specsJson,
				videoUrl: form.videoUrl || null,
				pdfUrl: form.pdfUrl || null,
				featured: form.featured,
				published: form.published,
				status: form.status,
			};

			const url = isEdit
				? `/api/admin/products/${product.id}`
				: "/api/admin/products";
			const res = await fetch(url, {
				method: isEdit ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to save");
			}

			toast.success(isEdit ? "产品已更新" : "产品已创建");
			onSaved();
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "保存失败");
		} finally {
			setSaving(false);
		}
	};

	const tabs = [
		{ key: "general" as const, label: "基本信息" },
		{ key: "descriptions" as const, label: "产品描述" },
		{ key: "media" as const, label: "图片与视频" },
		{ key: "advanced" as const, label: "技术参数" },
	];

	const inputCls =
		"w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
	const labelCls = "block text-xs font-medium text-gray-600 mb-1";

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
			<div className="fixed inset-0 bg-black/40" onClick={onClose} />
			<div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl my-auto">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						{isEdit ? "编辑产品" : "新增产品"}
					</h2>
					<button
						onClick={onClose}
						className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-200 px-6">
					{tabs.map((t) => (
						<button
							key={t.key}
							onClick={() => setActiveTab(t.key)}
							className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
								activeTab === t.key
									? "border-primary-600 text-primary-600"
									: "border-transparent text-gray-500 hover:text-gray-700"
							}`}
						>
							{t.label}
						</button>
					))}
				</div>

				{/* Body */}
				<div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-5">
					{/* General Tab */}
					{activeTab === "general" && (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className={labelCls}>名称 (English) *</label>
									<input
										className={inputCls}
										value={form.nameEn}
										onChange={(e) => set("nameEn", e.target.value)}
									/>
								</div>
								<div>
									<label className={labelCls}>名称 (中文)</label>
									<input
										className={inputCls}
										value={form.nameZh}
										onChange={(e) => set("nameZh", e.target.value)}
									/>
								</div>
								<div>
									<label className={labelCls}>名称 (日本語)</label>
									<input
										className={inputCls}
										value={form.nameJa}
										onChange={(e) => set("nameJa", e.target.value)}
									/>
								</div>
								<div>
									<label className={labelCls}>名称 (العربية)</label>
									<input
										className={inputCls}
										dir="rtl"
										value={form.nameAr}
										onChange={(e) => set("nameAr", e.target.value)}
									/>
								</div>
							</div>
							<button
								type="button"
								onClick={handleAutoTranslate}
								disabled={translating}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 disabled:opacity-50 transition-colors"
								title="根据中文名称和描述，自动翻译为英文、日文、阿拉伯文"
							>
								{translating ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Sparkles className="w-3.5 h-3.5" />
								)}
								{translating ? "翻译中…" : "中文 → 自动翻译 (En/Ja/Ar)"}
							</button>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<label className={labelCls}>SKU编号 *</label>
									<input
										className={inputCls}
										value={form.sku}
										onChange={(e) => set("sku", e.target.value)}
										placeholder="MDE-200HP-001"
									/>
								</div>
								<div>
									<label className={labelCls}>产品分类 *</label>
									<select
										className={inputCls}
										value={form.categoryId}
										onChange={(e) => set("categoryId", e.target.value)}
									>
										<option value="">选择分类…</option>
										{categories.map((c) => (
											<option key={c.id} value={c.id}>
												{c.nameEn}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className={labelCls}>状态</label>
									<select
										className={inputCls}
										value={form.status}
										onChange={(e) => set("status", e.target.value)}
									>
										<option value="draft">草稿</option>
										<option value="published">已发布</option>
										<option value="archived">已归档</option>
									</select>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
								<div>
									<label className={labelCls}>价格 (人民币/CNY)</label>
									<input
										type="number"
										step="0.01"
										min="0"
										className={inputCls}
										value={form.priceCny}
										onChange={(e) => setCnyPrice(e.target.value)}
									/>
								</div>
								<div>
									<label className={labelCls}>
										价格 (USD){" "}
										<span className="text-gray-400 font-normal">自动换算</span>
									</label>
									<input
										type="number"
										step="0.01"
										min="0"
										className={`${inputCls} bg-gray-50 text-gray-500`}
										value={form.priceUsd}
										readOnly
									/>
								</div>
								<div>
									<label className={labelCls}>最小起订量</label>
									<input
										type="number"
										min="1"
										className={inputCls}
										value={form.moq}
										onChange={(e) => set("moq", e.target.value)}
									/>
								</div>
								<div>
									<label className={labelCls}>交货周期 (天)</label>
									<input
										type="number"
										min="0"
										className={inputCls}
										value={form.leadTimeDays}
										onChange={(e) => set("leadTimeDays", e.target.value)}
									/>
								</div>
							</div>
							<div className="flex items-center gap-6 pt-1">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={form.published}
										onChange={(e) => set("published", e.target.checked)}
										className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
									/>
									<span className="text-sm text-gray-700">已发布</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={form.featured}
										onChange={(e) => set("featured", e.target.checked)}
										className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
									/>
									<span className="text-sm text-gray-700">推荐产品</span>
								</label>
							</div>
						</>
					)}

					{/* Descriptions Tab */}
					{activeTab === "descriptions" && (
						<>
							<button
								type="button"
								onClick={handleAutoTranslate}
								disabled={translating}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 disabled:opacity-50 transition-colors"
								title="根据中文描述，自动翻译为英文、日文、阿拉伯文"
							>
								{translating ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Sparkles className="w-3.5 h-3.5" />
								)}
								{translating ? "翻译中…" : "中文 → 自动翻译 (En/Ja/Ar)"}
							</button>
							{(
								[
									["descZh", "产品描述 (中文)"],
									["descEn", "产品描述 (English)"],
									["descJa", "产品描述 (日本語)"],
									["descAr", "产品描述 (العربية)"],
								] as const
							).map(([key, label]) => (
								<div key={key}>
									<label className={labelCls}>{label}</label>
									<textarea
										rows={3}
										className={inputCls}
										value={form[key]}
										onChange={(e) => set(key, e.target.value)}
										dir={key === "descAr" ? "rtl" : undefined}
									/>
								</div>
							))}
						</>
					)}

					{/* Media Tab */}
					{activeTab === "media" && (
						<>
							{/* --- 批量图片上传 --- */}
							<div>
								<label className={labelCls}>
									<ImagePlus className="w-3.5 h-3.5 inline mr-1" />
									产品图片（批量上传）
								</label>
								<div
									className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
										dragOver
											? "border-primary-400 bg-primary-50"
											: "border-gray-300 hover:border-gray-400"
									}`}
									onDragOver={(e) => {
										e.preventDefault();
										setDragOver(true);
									}}
									onDragLeave={() => setDragOver(false)}
									onDrop={handleDrop}
								>
									<ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
									<p className="text-sm text-gray-600 mb-1">
										拖拽图片到此处，或点击浏览
									</p>
									<p className="text-xs text-gray-400">
										支持 jpg、jpeg、png、webp、svg，单张最大10MB
									</p>
									<button
										type="button"
										onClick={() => imageInputRef.current?.click()}
										className="mt-3 px-4 py-1.5 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700"
									>
										选择图片
									</button>
									<input
										ref={imageInputRef}
										type="file"
										multiple
										accept=".jpg,.jpeg,.png,.webp,.svg"
										className="hidden"
										onChange={(e) =>
											e.target.files && uploadFiles(e.target.files)
										}
									/>
								</div>

								{/* Upload progress */}
								{uploadingFiles.filter((f) => f.status === "uploading").length >
									0 && (
									<div className="mt-2 space-y-1">
										{uploadingFiles
											.filter((f) => f.status === "uploading")
											.map((f) => (
												<div
													key={f.id}
													className="flex items-center gap-2 text-xs text-gray-500"
												>
													<Loader2 className="w-3 h-3 animate-spin" />
													<span className="truncate">{f.file.name}</span>
													<span>上传中...</span>
												</div>
											))}
									</div>
								)}

								{/* Image thumbnails grid */}
								{imageList.length > 0 && (
									<div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
										{imageList.map((url, idx) => (
											<div
												key={`${url}-${idx}`}
												className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
											>
												<Image
													src={getImageUrl(url)}
													alt={`产品图片 ${idx + 1}`}
													fill
													className="object-cover"
													sizes="100px"
												/>
												<div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
													<button
														type="button"
														onClick={() => optimizeImage(url, idx)}
														className="p-1 bg-white/90 rounded text-xs text-primary-700 hover:bg-white"
														title="自动优化为适合船艇设备跨境电商的专业图片"
													>
														<Sparkles className="w-3.5 h-3.5" />
													</button>
													<button
														type="button"
														onClick={() => removeImage(idx)}
														className="p-1 bg-white/90 rounded text-xs text-red-600 hover:bg-white"
														title="删除图片"
													>
														<X className="w-3.5 h-3.5" />
													</button>
												</div>
												<span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
													{idx + 1}
												</span>
											</div>
										))}
									</div>
								)}

								{/* AI optimization hint */}
								{imageList.length > 0 && (
									<p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
										<Sparkles className="w-3 h-3" />
										点击图片上的 ✨ 按钮：AI优化图片 —
										自动优化为适合船艇设备跨境电商的专业图片
									</p>
								)}
							</div>

							{/* --- 视频上传 --- */}
							<div>
								<label className={labelCls}>
									<Film className="w-3.5 h-3.5 inline mr-1" />
									视频（本地上传或外部链接）
								</label>
								<div className="flex gap-3 items-start">
									<div className="flex-1">
										<input
											className={inputCls}
											value={form.videoUrl}
											onChange={(e) => set("videoUrl", e.target.value)}
											placeholder="视频URL，例如: https://youtube.com/... 或上传本地视频"
										/>
									</div>
									<button
										type="button"
										onClick={() => videoInputRef.current?.click()}
										disabled={uploadingVideo}
										className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
									>
										{uploadingVideo ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Upload className="w-4 h-4" />
										)}
										上传视频
									</button>
									<input
										ref={videoInputRef}
										type="file"
										accept=".mp4,.webm"
										className="hidden"
										onChange={handleVideoUpload}
									/>
								</div>
								<p className="mt-1 text-xs text-gray-400">
									支持 mp4、webm 格式，最大50MB
								</p>
							</div>

							{/* --- PDF --- */}
							<div>
								<label className={labelCls}>PDF 文档</label>
								{/* File upload field with upload button */}
								<div>
									<FileUploadField
										label="产品规格/手册 (PDF)"
										value={form.pdfUrl}
										onChange={(url) => set("pdfUrl", url)}
										accept=".pdf"
									/>
								</div>
							</div>
						</>
					)}

					{/* Advanced Tab */}
					{activeTab === "advanced" && (
						<div>
							<label className={labelCls}>技术参数 (JSON)</label>
							<textarea
								rows={8}
								className={`${inputCls} font-mono text-xs`}
								value={form.specsJson}
								onChange={(e) => set("specsJson", e.target.value)}
								placeholder='{"功率": "200HP", "重量": "500kg", "尺寸": "1200×800×600mm"}'
							/>
							<p className="mt-1 text-xs text-gray-400">
								输入JSON格式的产品技术参数，每个键值对将显示在参数表中。
							</p>
							<div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
								<p className="font-medium text-gray-600 mb-1">💡 填写示例：</p>
								<pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{`{
  "型号": "YJ-ME200",
  "功率": "200HP / 149kW",
  "转速": "1800-3600 RPM",
  "重量": "500kg",
  "尺寸 (长×宽×高)": "1200×800×600mm",
  "燃油类型": "柴油",
  "冷却方式": "水冷",
  "排放标准": "IMO Tier II",
  "适用船型": "渔船 / 货船 / 游艇",
  "质保期": "18个月"
}`}</pre>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
					<button
						onClick={onClose}
						disabled={saving}
						className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						取消
					</button>
					<button
						onClick={handleSubmit}
						disabled={saving}
						className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
					>
						{saving && <Loader2 className="w-4 h-4 animate-spin" />}
						{isEdit ? "保存更改" : "创建产品"}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Batch Upload Modal                                                */
/* ------------------------------------------------------------------ */

function BatchUploadModal({
	onClose,
	onDone,
}: {
	onClose: () => void;
	onDone: () => void;
}) {
	const [jsonText, setJsonText] = useState("");
	const [parsed, setParsed] = useState<Record<string, unknown>[] | null>(null);
	const [parseError, setParseError] = useState("");
	const [uploading, setUploading] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const tryParse = (text: string) => {
		setJsonText(text);
		setParseError("");
		setParsed(null);
		if (!text.trim()) return;
		try {
			const data = JSON.parse(text);
			if (!Array.isArray(data)) throw new Error("JSON必须是产品数组");
			if (data.length === 0) throw new Error("数组为空");
			if (data.length > 500) throw new Error("每批最多500个产品");
			setParsed(data);
		} catch (e: unknown) {
			setParseError(e instanceof Error ? e.message : "无效的JSON");
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => tryParse(reader.result as string);
		reader.readAsText(file);
	};

	const downloadJsonTemplate = () => {
		const blob = new Blob([JSON.stringify(BATCH_TEMPLATE, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "product-batch-template.json";
		a.click();
		URL.revokeObjectURL(url);
	};

	const downloadCsvTemplate = () => {
		const BOM = "\uFEFF";
		const csv =
			BOM +
			CSV_TEMPLATE_HEADERS.join(",") +
			"\n" +
			CSV_TEMPLATE_EXAMPLE.map((v) => `"${v}"`).join(",") +
			"\n";
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "产品导入模板.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleUpload = async () => {
		if (!parsed) return;
		setUploading(true);
		try {
			const res = await fetch("/api/admin/products/batch", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ products: parsed }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "批量导入失败");

			const errCount = data.errors?.length ?? 0;
			if (errCount > 0) {
				toast.success(
					`成功创建 ${data.createdCount} / ${data.totalSubmitted} 个产品`,
				);
				toast.error(`${errCount} 个产品导入失败 — 请查看控制台`);
				console.table(data.errors);
			} else {
				toast.success(`全部 ${data.createdCount} 个产品创建成功`);
			}
			onDone();
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "批量导入失败");
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
			<div className="fixed inset-0 bg-black/40" onClick={onClose} />
			<div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl my-auto">
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Upload className="w-5 h-5" />
						批量导入产品
					</h2>
					<button
						onClick={onClose}
						className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="px-6 py-5 space-y-4">
					{/* Instructions */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
						<p className="font-medium mb-1">📋 使用说明</p>
						<ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-700">
							<li>下载CSV或JSON模板文件</li>
							<li>按模板格式填写产品信息</li>
							<li>将JSON数据粘贴到下方文本框，或上传JSON文件</li>
							<li>确认产品列表后点击&quot;开始导入&quot;</li>
						</ol>
					</div>

					{/* Actions row */}
					<div className="flex flex-wrap gap-3">
						<button
							onClick={downloadCsvTemplate}
							className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
						>
							<FileSpreadsheet className="w-4 h-4" />
							下载模板 (CSV)
						</button>
						<button
							onClick={downloadJsonTemplate}
							className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
						>
							<Download className="w-4 h-4" />
							下载模板 (JSON)
						</button>
						<button
							onClick={() => fileRef.current?.click()}
							className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
						>
							<FileJson className="w-4 h-4" />
							上传JSON文件
						</button>
						<input
							ref={fileRef}
							type="file"
							accept=".json"
							className="hidden"
							onChange={handleFileUpload}
						/>
					</div>

					{/* JSON textarea */}
					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							粘贴JSON产品数组，或使用上方按钮上传文件
						</label>
						<textarea
							rows={10}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							value={jsonText}
							onChange={(e) => tryParse(e.target.value)}
							placeholder={JSON.stringify(BATCH_TEMPLATE, null, 2)}
						/>
					</div>

					{/* Parse result */}
					{parseError && (
						<div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
							<AlertTriangle className="w-4 h-4 flex-shrink-0" />
							{parseError}
						</div>
					)}

					{parsed && (
						<div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
							<div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
								<Check className="w-4 h-4" />
								{parsed.length} 个产品已就绪
							</div>
							<div className="max-h-40 overflow-y-auto">
								<table className="w-full text-xs">
									<thead>
										<tr className="text-left text-green-700">
											<th className="pr-3 py-1">#</th>
											<th className="pr-3 py-1">名称</th>
											<th className="pr-3 py-1">SKU</th>
										</tr>
									</thead>
									<tbody className="text-green-900">
										{parsed.slice(0, 20).map((p, i) => (
											<tr key={i}>
												<td className="pr-3 py-0.5">{i + 1}</td>
												<td className="pr-3 py-0.5 truncate max-w-[200px]">
													{String(p.nameZh || p.nameEn || "—")}
												</td>
												<td className="pr-3 py-0.5 font-mono">
													{String(p.sku || "—")}
												</td>
											</tr>
										))}
										{parsed.length > 20 && (
											<tr>
												<td colSpan={3} className="py-1 text-green-600 italic">
													…还有 {parsed.length - 20} 个产品
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
					<button
						onClick={onClose}
						disabled={uploading}
						className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						取消
					</button>
					<button
						onClick={handleUpload}
						disabled={!parsed || uploading}
						className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
					>
						{uploading && <Loader2 className="w-4 h-4 animate-spin" />}
						开始导入 {parsed ? `${parsed.length} 个产品` : ""}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function ProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");

	// Modals
	const [formProduct, setFormProduct] = useState<Product | null | undefined>(
		undefined,
	); // undefined=closed, null=create, Product=edit
	const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
	const [showBatch, setShowBatch] = useState(false);
	const [showCategoryManager, setShowCategoryManager] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Inline action loading
	const [actionId, setActionId] = useState<string | null>(null);

	/* Fetch categories */
	const fetchCategories = useCallback(() => {
		fetch("/api/admin/categories")
			.then((r) => r.json())
			.then((d) => setCategories(flattenCategories(d.categories ?? [])))
			.catch(() => {});
	}, []);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	/* Fetch products */
	const fetchProducts = useCallback(async () => {
		setLoading(true);
		try {
			const qs = new URLSearchParams({ page: String(page), limit: "20" });
			if (search) qs.set("search", search);
			if (categoryFilter) qs.set("categoryId", categoryFilter);
			if (statusFilter) qs.set("status", statusFilter);

			const res = await fetch(`/api/admin/products?${qs}`);
			if (!res.ok) throw new Error("Failed to fetch");
			const data = await res.json();
			setProducts(data.products ?? []);
			setTotalPages(data.totalPages ?? 1);
			setTotal(data.total ?? 0);
		} catch {
			setProducts([]);
		} finally {
			setLoading(false);
		}
	}, [page, search, categoryFilter, statusFilter]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	const handleSearch = () => {
		setSearch(searchInput);
		setPage(1);
	};

	/* Quick actions */
	const togglePublish = async (p: Product) => {
		setActionId(p.id);
		try {
			const res = await fetch(`/api/admin/products/${p.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "togglePublished" }),
			});
			if (!res.ok) throw new Error();
			const updated = await res.json();
			setProducts((prev) =>
				prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)),
			);
			toast.success(updated.published ? "产品已发布" : "产品已取消发布");
		} catch {
			toast.error("操作失败");
		} finally {
			setActionId(null);
		}
	};

	const toggleFeatured = async (p: Product) => {
		setActionId(p.id);
		try {
			const res = await fetch(`/api/admin/products/${p.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "toggleFeatured" }),
			});
			if (!res.ok) throw new Error();
			const updated = await res.json();
			setProducts((prev) =>
				prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)),
			);
			toast.success(updated.featured ? "已设为推荐" : "已取消推荐");
		} catch {
			toast.error("操作失败");
		} finally {
			setActionId(null);
		}
	};

	const changeStatus = async (p: Product, newStatus: string) => {
		setActionId(p.id);
		try {
			const res = await fetch(`/api/admin/products/${p.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "setStatus", value: newStatus }),
			});
			if (!res.ok) throw new Error();
			const updated = await res.json();
			setProducts((prev) =>
				prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)),
			);
			toast.success(`状态已更改为${STATUS_LABELS[newStatus] ?? newStatus}`);
		} catch {
			toast.error("状态更改失败");
		} finally {
			setActionId(null);
		}
	};

	const handleDelete = async () => {
		if (!deleteProduct) return;
		setDeleting(true);
		try {
			const res = await fetch(`/api/admin/products/${deleteProduct.id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to delete");
			}
			toast.success("产品已删除");
			setDeleteProduct(null);
			fetchProducts();
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "删除失败");
		} finally {
			setDeleting(false);
		}
	};

	const openEdit = async (p: Product) => {
		// Fetch full product for edit
		try {
			const res = await fetch(`/api/admin/products/${p.id}`);
			if (!res.ok) throw new Error();
			const full = await res.json();
			setFormProduct(full);
		} catch {
			toast.error("加载产品详情失败");
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
				<div className="flex items-center gap-2 self-end sm:self-auto">
					<button
						onClick={() => setShowCategoryManager(true)}
						className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
					>
						<FolderTree className="w-4 h-4" />
						<span className="hidden sm:inline">分类管理</span>
					</button>
					<button
						onClick={() => setShowBatch(true)}
						className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
					>
						<Upload className="w-4 h-4" />
						<span className="hidden sm:inline">批量导入</span>
					</button>
					<button
						onClick={() => setFormProduct(null)}
						className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						新增产品
					</button>
					<button
						onClick={fetchProducts}
						className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
						title="刷新"
					>
						<RefreshCw className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
				<div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<Filter className="w-4 h-4" />
						筛选
					</div>
					<div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div>
							<label className="block text-xs font-medium text-gray-500 mb-1">
								搜索
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									placeholder="名称、SKU…"
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSearch()}
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
								/>
								<button
									onClick={handleSearch}
									className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
								>
									<Search className="w-4 h-4" />
								</button>
							</div>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-500 mb-1">
								产品分类
							</label>
							<select
								value={categoryFilter}
								onChange={(e) => {
									setCategoryFilter(e.target.value);
									setPage(1);
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							>
								<option value="">全部分类</option>
								{categories.map((c) => (
									<option key={c.id} value={c.id}>
										{c.nameEn}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-xs font-medium text-gray-500 mb-1">
								状态
							</label>
							<select
								value={statusFilter}
								onChange={(e) => {
									setStatusFilter(e.target.value);
									setPage(1);
								}}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							>
								<option value="">全部状态</option>
								<option value="published">已发布</option>
								<option value="draft">草稿</option>
								<option value="archived">已归档</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* Loading skeleton */}
			{loading && (
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="animate-pulse flex items-center gap-4">
								<div className="w-12 h-12 bg-gray-200 rounded" />
								<div className="flex-1 space-y-2">
									<div className="h-4 bg-gray-200 rounded w-1/3" />
									<div className="h-3 bg-gray-200 rounded w-1/4" />
								</div>
								<div className="h-6 bg-gray-200 rounded w-20" />
							</div>
						))}
					</div>
				</div>
			)}

			{/* Empty state */}
			{!loading && products.length === 0 && (
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
					<Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
					<p className="text-gray-500 text-sm mb-4">暂无产品</p>
					<button
						onClick={() => setFormProduct(null)}
						className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 inline-flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />
						添加第一个产品
					</button>
				</div>
			)}

			{/* Products Table */}
			{!loading && products.length > 0 && (
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="bg-gray-50 border-b border-gray-200">
									<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
										产品
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
										SKU编号
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
										分类
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
										价格
									</th>
									<th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
										状态
									</th>
									<th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
										推荐
									</th>
									<th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
										操作
									</th>
								</tr>
							</thead>
							<tbody>
								{products.map((product) => {
									const img = getFirstImage(product.images);
									const busy = actionId === product.id;
									return (
										<tr
											key={product.id}
											className="border-b border-gray-100 hover:bg-gray-50"
										>
											{/* Product name + image */}
											<td className="px-4 py-3">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
														{img ? (
															<Image
																src={img}
																alt={product.nameEn}
																width={40}
																height={40}
																className="w-full h-full object-cover"
															/>
														) : (
															<div className="w-full h-full flex items-center justify-center">
																<Package className="w-4 h-4 text-gray-400" />
															</div>
														)}
													</div>
													<div className="min-w-0">
														<p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
															{product.nameEn}
														</p>
													</div>
												</div>
											</td>
											{/* SKU */}
											<td className="px-4 py-3 text-sm font-mono text-gray-600">
												{product.sku}
											</td>
											{/* Category */}
											<td className="px-4 py-3 text-sm text-gray-600">
												{product.category?.nameEn ?? "—"}
											</td>
											{/* Price */}
											<td className="px-4 py-3 text-sm text-gray-700 font-medium">
												${product.priceUsd.toLocaleString()}
											</td>
											{/* Status badge + quick change */}
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<span
														className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
															STATUS_COLORS[product.status] ??
															STATUS_COLORS.draft
														}`}
													>
														{STATUS_LABELS[product.status] ?? product.status}
													</span>
													<div className="relative inline-flex items-center">
														<select
															value={product.status}
															disabled={busy}
															onChange={(e) =>
																changeStatus(product, e.target.value)
															}
															className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
															title="更改状态"
														>
															<option value="draft">草稿</option>
															<option value="published">已发布</option>
															<option value="archived">已归档</option>
														</select>
														<ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none" />
													</div>
												</div>
											</td>
											{/* Featured toggle */}
											<td className="px-4 py-3 text-center">
												<button
													onClick={() => toggleFeatured(product)}
													disabled={busy}
													className={`p-1 rounded transition-colors disabled:opacity-50 ${
														product.featured
															? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
															: "text-gray-300 hover:text-amber-400 hover:bg-gray-100"
													}`}
													title={product.featured ? "取消推荐" : "设为推荐"}
												>
													{product.featured ? (
														<Star className="w-4 h-4 fill-current" />
													) : (
														<StarOff className="w-4 h-4" />
													)}
												</button>
											</td>
											{/* Actions */}
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-1">
													<button
														onClick={() => togglePublish(product)}
														disabled={busy}
														className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
															product.published
																? "text-green-600 hover:bg-green-50"
																: "text-gray-400 hover:bg-gray-100"
														}`}
														title={product.published ? "取消发布" : "发布"}
													>
														{product.published ? (
															<ToggleRight className="w-4 h-4" />
														) : (
															<ToggleLeft className="w-4 h-4" />
														)}
													</button>
													<button
														onClick={() => openEdit(product)}
														className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
														title="编辑"
													>
														<Pencil className="w-4 h-4" />
													</button>
													<a
														href={`/en/products/${product.slug}`}
														target="_blank"
														rel="noopener noreferrer"
														className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
														title="查看"
													>
														<Eye className="w-4 h-4" />
													</a>
													<button
														onClick={() => setDeleteProduct(product)}
														className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
														title="删除"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
							<p className="text-sm text-gray-500">
								Page {page} of {totalPages} ({total} 个产品)
							</p>
							<div className="flex items-center gap-2">
								<button
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page <= 1}
									className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
								>
									Previous
								</button>
								{/* Page numbers (show up to 5 pages) */}
								{(() => {
									const pages: number[] = [];
									let start = Math.max(1, page - 2);
									const end = Math.min(totalPages, start + 4);
									start = Math.max(1, end - 4);
									for (let i = start; i <= end; i++) pages.push(i);
									return pages.map((p) => (
										<button
											key={p}
											onClick={() => setPage(p)}
											className={`w-8 h-8 rounded-md text-sm font-medium ${
												p === page
													? "bg-primary-600 text-white"
													: "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
											}`}
										>
											{p}
										</button>
									));
								})()}
								<button
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page >= totalPages}
									className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ---- Modals ---- */}

			{/* Product Form Modal (create / edit) */}
			{formProduct !== undefined && (
				<ProductFormModal
					product={formProduct}
					categories={categories}
					onClose={() => setFormProduct(undefined)}
					onSaved={() => {
						setFormProduct(undefined);
						fetchProducts();
					}}
				/>
			)}

			{/* Delete Confirmation */}
			{deleteProduct && (
				<DeleteModal
					product={deleteProduct}
					deleting={deleting}
					onClose={() => setDeleteProduct(null)}
					onConfirm={handleDelete}
				/>
			)}

			{/* Batch Upload */}
			{showBatch && (
				<BatchUploadModal
					onClose={() => setShowBatch(false)}
					onDone={() => {
						setShowBatch(false);
						fetchProducts();
					}}
				/>
			)}

			{showCategoryManager && (
				<CategoryManagerModal
					onClose={() => setShowCategoryManager(false)}
					onUpdate={fetchCategories}
				/>
			)}
		</div>
	);
}
